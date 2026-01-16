/**
 * Organization Settings API
 *
 * Saves organization settings (WhatsApp phone_number_id, phone number, etc).
 *
 * NOTE: This is a stub that assumes you will later add authentication.
 * For now, it expects an `organizationId` in the body.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      organizationId,
      whatsapp_phone_number_id,
      whatsapp_phone_number,
    }: {
      organizationId?: string
      whatsapp_phone_number_id?: string
      whatsapp_phone_number?: string
    } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required (auth not implemented yet)' },
        { status: 400 }
      )
    }

    if (!whatsapp_phone_number_id) {
      return NextResponse.json(
        { error: 'whatsapp_phone_number_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
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

    return NextResponse.json({ success: true, organization: data })
  } catch (error) {
    console.error('Error saving organization settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
