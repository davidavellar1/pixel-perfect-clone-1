import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_AFTER_DAYS = 3
const LAPSE_AFTER_DAYS = 14
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
        const unauthorized = await authenticateCronRequest(request)
        if (unauthorized) return unauthorized

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const now = Date.now()

        const { data: requests, error } = await supabaseAdmin
          .from('access_request')
          .select(
            'id, project_id, investor_user_id, state, submitted_at, fee_tail_expires_at, project:project_id(slug, title, developer:developer_id(user_id))',
          )
          .in('state', ['pending', 'granted', 'granted_full'])

        if (error) {
          console.error('[access-reminders] query failed', error.message)
          return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const notifications: NotificationInsert[] = []
        const lapsed: string[] = []

        for (const row of requests ?? []) {
          const project = row.project as unknown as
            | { slug: string; title: string; developer: { user_id: string } | null }
            | null
          const ownerId = project?.developer?.user_id
          const title = project?.title ?? 'your listing'
          const slug = project?.slug ?? ''
          const submitted = row.submitted_at ? new Date(row.submitted_at).getTime() : now
          const ageDays = Math.floor((now - submitted) / DAY_MS)

          if (row.state === 'pending' && ageDays >= LAPSE_AFTER_DAYS) {
            lapsed.push(row.id)
            continue
          }

          if (row.state === 'pending' && ageDays >= REMINDER_AFTER_DAYS && ownerId) {
            const bucket = Math.floor(ageDays / REMINDER_AFTER_DAYS)
            notifications.push({
              user_id: ownerId,
              kind: 'access_request_reminder',
              title: 'Access request still waiting',
              body: `An access request on ${title} has been open for ${ageDays} days. It lapses automatically after ${LAPSE_AFTER_DAYS} days.`,
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
                link: slug ? `/app/projects/${slug}` : '/app/my-listings',
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
          if (lapseError) console.error('[access-reminders] lapse failed', lapseError.message)
        }

        if (notifications.length) {
          const { error: insertError } = await supabaseAdmin
            .from('notification')
            .upsert(notifications, { onConflict: 'dedupe_key', ignoreDuplicates: true })
          if (insertError) console.error('[access-reminders] notify failed', insertError.message)
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
