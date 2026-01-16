/**
 * WhatsApp Tenant Resolution
 *
 * Multi-tenant SaaS: each customer (organization) connects their own WhatsApp phone_number_id.
 * Incoming webhook payload includes value.metadata.phone_number_id.
 * We use that value to find the organization that owns the number.
 */

import { supabaseServer } from '@/lib/supabase/client'

export type WhatsAppTenant = {
  organizationId: string
  phoneNumberId: string
  /** Optional - if you store per-tenant token later */
  accessToken?: string
}

/**
 * Resolve organization (tenant) by WhatsApp Cloud API phone_number_id.
 */
export async function resolveTenantByPhoneNumberId(phoneNumberId?: string | null): Promise<WhatsAppTenant | null> {
  if (!phoneNumberId) return null

  // We look for the organization that has this whatsapp_phone_number_id configured
  const { data, error } = await supabaseServer
    .from('organizations')
    .select('id, whatsapp_phone_number_id')
    .eq('whatsapp_phone_number_id', phoneNumberId)
    .single()

  if (error || !data) {
    console.warn(`No tenant found for WhatsApp phone_number_id: ${phoneNumberId}`)
    return null
  }

  return {
    organizationId: data.id,
    phoneNumberId: data.whatsapp_phone_number_id,
  }
}
