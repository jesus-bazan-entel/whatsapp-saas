/**
 * Organization Settings API (SaaS)
 *
 * Saves organization settings for the currently authenticated user.
 * Multi-tenant: org is inferred from team_members using the logged-in user's email.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      whatsapp_phone_number_id?: string
      whatsapp_phone_number?: string
    }

    const supabase = createSupabaseServerClient(request)
    const { data } = await supabase.auth.getUser()

    const email = data.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whatsapp_phone_number_id = body.whatsapp_phone_number_id
    const whatsapp_phone_number = body.whatsapp_phone_number

    if (!whatsapp_phone_number_id) {
      return NextResponse.json({ error: 'whatsapp_phone_number_id is required' }, { status: 400 })
    }

    // Find user's organization
    const { data: member, error: memberError } = await supabaseServer
      .from('team_members')
      .select('organization_id')
      .eq('email', email)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organizationId = member.organization_id

    // Update org mapping used by webhook tenant resolution
    const { data: updated, error } = await supabaseServer
      .from('organizations')
      .update({
        whatsapp_phone_number_id,
        whatsapp_phone_number: whatsapp_phone_number || null,
        whatsapp_configured: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, organization: updated })
  } catch (error) {
    console.error('Error saving organization settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
