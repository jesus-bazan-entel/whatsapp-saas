/**
 * Get current organization for logged-in user.
 *
 * Uses Supabase session cookies from the request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data } = await supabase.auth.getUser()

    const email = data.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find team member + org
    const { data: member, error } = await supabaseServer
      .from('team_members')
      .select('organization_id, organizations(*)')
      .eq('email', email)
      .single()

    if (error || !member) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ organization: member.organizations })
  } catch (error) {
    console.error('organization/me error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
