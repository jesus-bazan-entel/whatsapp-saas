import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware
 *
 * Protects /dashboard routes by requiring a Supabase session.
 *
 * Public:
 * - /auth/login
 * - /auth/signup
 * - /api/whatsapp/webhook (Meta webhook)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/whatsapp/webhook') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Only protect dashboard + settings pages
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured - redirect to login with error
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              response.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
