/**
 * Onboarding - Create Organization
 *
 * This endpoint creates:
 * - organizations row
 * - team_members row (owner/admin)
 *
 * It uses the Supabase service role key (supabaseServer) so it can insert regardless of RLS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, email } = (await request.json()) as {
      companyName?: string
      email?: string
    }

    if (!companyName || !email) {
      return NextResponse.json({ error: 'companyName and email are required' }, { status: 400 })
    }

    // Create org
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({
        name: companyName,
        slug: slugify(companyName),
        email,
        subscription_plan: 'starter',
        subscription_status: 'active',
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Create team member (owner)
    const { error: memberError } = await supabaseServer.from('team_members').insert({
      organization_id: org.id,
      email,
      name: companyName,
      role: 'admin',
      is_owner: true,
    })

    if (memberError) throw memberError

    return NextResponse.json({ organizationId: org.id })
  } catch (error) {
    console.error('create-organization error:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
