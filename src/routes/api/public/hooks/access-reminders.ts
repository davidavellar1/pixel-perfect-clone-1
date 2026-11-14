import { createFileRoute } from '@tanstack/react-router'

const DAY_MS = 24 * 60 * 60 * 1000
import { SLA_LAPSE_WORKING_DAYS, SLA_REMINDER_HOURS, workingDaysSince } from '@/lib/access'
import { pendingAccessNotices } from '@/lib/accessNotices'
const FEE_TAIL_WARN_DAYS = 30

type NotificationInsert = {
  user_id: string
  kind: string
  title: string
  body: string
  link: string
  project_id: string
  access_request_id: string
  dedupe_key: string
}

export const Route = createFileRoute('/api/public/hooks/access-reminders')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const provided = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '')?.[1]
        if (!provided) return new Response('Unauthorized', { status: 401 })

        const { data: tokenRow } = await supabaseAdmin
          .from('cron_token')
          .select('token')
          .eq('id', 1)
          .maybeSingle()

        const expected = tokenRow?.token
        if (!expected) return new Response('Server configuration error', { status: 500 })

        const { createHash, timingSafeEqual } = await import('node:crypto')
        const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()
        if (!timingSafeEqual(digest(provided), digest(expected))) {
          return new Response('Unauthorized', { status: 401 })
        }

        const now = Date.now()

        const { data: requests, error } = await supabaseAdmin
          .from('access_request')
          .select(
            'id, project_id, investor_user_id, state, submitted_at, developer_question_at, investor_reply_at, fee_tail_expires_at, project:project_id(slug, title, developer:developer_id(user_id))',
          )
          .in('state', ['pending', 'granted', 'granted_full'])

        if (error) {
          console.error('[access-reminders] query failed', error.message)
          return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const notifications: NotificationInsert[] = []
        const lapsed: string[] = []
        const ids = [...new Set((requests ?? []).map(row => row.project_id))]
        const { data: teasers, error: teaserError } = ids.length
          ? await supabaseAdmin.from('project_teaser').select('id,teaser_title').in('id', ids)
          : { data: [], error: null }
        if (teaserError) return Response.json({ success: false, error: 'Could not load teaser titles' }, { status: 500 })
        const teaserTitles = new Map((teasers ?? []).map(row => [row.id, row.teaser_title]))

        for (const row of requests ?? []) {
          const project = row.project as unknown as
            | { slug: string; title: string; developer: { user_id: string } | null }
            | null
          const ownerId = project?.developer?.user_id
          const title = project?.title ?? 'your listing'
          const teaserTitle = teaserTitles.get(row.project_id) || 'a listing'
          const slug = project?.slug ?? ''
          const clockStart = row.investor_reply_at || row.submitted_at
          const paused = Boolean(row.developer_question_at && !row.investor_reply_at)
          const workingDays = workingDaysSince(clockStart, new Date(now))
          const hours = (now - new Date(clockStart).getTime()) / 3_600_000

          if (row.state === 'pending' && !paused && workingDays >= SLA_LAPSE_WORKING_DAYS) {
            lapsed.push(row.id)
            notifications.push(...pendingAccessNotices({ ...row, ownerId, workingDays, paused, title, teaserTitle }))
            continue
          }

          if (row.state === 'pending') {
            notifications.push(...pendingAccessNotices({ ...row, ownerId, workingDays, paused, title, teaserTitle }))
          }

          if (row.state === 'pending' && !paused && hours >= SLA_REMINDER_HOURS && ownerId) {
            const bucket = Math.floor(hours / SLA_REMINDER_HOURS)
            notifications.push({
              user_id: ownerId,
              kind: 'access_request_reminder',
              title: 'Access request still waiting',
              body: `An access request on ${title} has been open for ${workingDays} working days. It lapses without approval after ${SLA_LAPSE_WORKING_DAYS} working days.`,
              link: `/app/access-requests?request=${row.id}`,
              project_id: row.project_id,
              access_request_id: row.id,
              dedupe_key: `access_request_reminder:${row.id}:${bucket}`,
            })
          }

          if (row.fee_tail_expires_at && ownerId) {
            const expires = new Date(row.fee_tail_expires_at).getTime()
            const daysLeft = Math.ceil((expires - now) / DAY_MS)
            if (daysLeft > 0 && daysLeft <= FEE_TAIL_WARN_DAYS) {
              notifications.push({
                user_id: ownerId,
                kind: 'fee_tail_expiring',
                title: 'Introduction fee tail expiring',
                body: `The fee tail for an introduction on ${title} expires in ${daysLeft} days.`,
                link: slug ? `/app/projects/${slug}` : '/app/my-deals/listing',
                project_id: row.project_id,
                access_request_id: row.id,
                dedupe_key: `fee_tail_expiring:${row.id}`,
              })
            }
          }
        }

        if (lapsed.length) {
          const { error: lapseError } = await supabaseAdmin
            .from('access_request')
            .update({ state: 'lapsed' })
            .in('id', lapsed)
            .eq('state', 'pending')
          if (lapseError) return Response.json({ success: false, error: 'Could not lapse requests' }, { status: 500 })
        }

        if (notifications.length) {
          const { error: insertError } = await supabaseAdmin
            .from('notification')
            .upsert(notifications, { onConflict: 'dedupe_key', ignoreDuplicates: true })
          if (insertError) return Response.json({ success: false, error: 'Could not save reminders' }, { status: 500 })
        }

        return Response.json({
          success: true,
          scanned: requests?.length ?? 0,
          lapsed: lapsed.length,
          notifications: notifications.length,
        })
      },
    },
  },
})
