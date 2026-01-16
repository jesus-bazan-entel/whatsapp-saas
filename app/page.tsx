import { redirect } from 'next/navigation'

/**
 * Home
 *
 * In SaaS mode, we send users to /dashboard. Middleware will redirect
 * unauthenticated users to /auth/login.
 */
export default function Home() {
  redirect('/dashboard')
}
