/**
 * Supabase Server Client (Route Handlers)
 *
 * Next.js 15 `cookies()` types can be async depending on runtime.
 * To avoid type issues and keep it simple, we build a server client using
 * the incoming NextRequest cookies.
 *
 * NOTE:
 * - This helper is intended for Route Handlers (app/api/*).
 * - For client-side auth, use `createSupabaseBrowserClient()`.
 */

import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Not needed for our current server reads. Client handles session cookies.
        setAll() {},
      },
    }
  )
}
