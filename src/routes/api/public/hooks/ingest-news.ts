import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const BodySchema = z
  .object({ source: z.string().min(1).max(100).optional(), force: z.boolean().optional() })
  .strict()

export const Route = createFileRoute('/api/public/hooks/ingest-news')({
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

        let options: z.infer<typeof BodySchema> = {}
        const raw = await request.text()
        if (raw.trim()) {
          try {
            options = BodySchema.parse(JSON.parse(raw))
          } catch {
            return Response.json({ success: false, error: 'Invalid body' }, { status: 400 })
          }
        }

        try {
          const { runIngest } = await import('@/lib/news/ingest.server')
          const result = await runIngest(options)
          return Response.json(result)
        } catch (e) {
          const message = e instanceof Error ? e.message.split('\n')[0] : 'Ingest failed'
          console.error('[ingest-news] run failed', message)
          return Response.json({ success: false, error: message }, { status: 500 })
        }
      },
    },
  },
})
