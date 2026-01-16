/**
 * Backwards compatible exports.
 *
 * IMPORTANT:
 * - Do NOT import this file from Client Components.
 * - Client components should import from: `@/lib/supabase/browser`
 */

export { createSupabaseServerClient } from './server'
export { createSupabaseBrowserClient } from './browser'
