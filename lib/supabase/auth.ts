/**
 * Authentication & Organization Management
 * 
 * Handles user authentication, organization management, and multi-tenant isolation
 */

import { supabaseServer } from './client'

/**
 * Get current user's organization
 * Used to ensure data isolation across tenants
 */
export async function getCurrentOrganization(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('team_members')
      .select('organization_id, organizations(*)')
      .eq('email', userId)
      .single()

    if (error) throw error
    return data?.organizations
  } catch (error) {
    console.error('Error getting organization:', error)
    return null
  }
}

/**
 * Create new organization (for new customers)
 */
export async function createOrganization(
  name: string,
  email: string,
  phone?: string,
  website?: string
) {
  try {
    // Create organization
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        email,
        phone,
        website,
        subscription_plan: 'starter',
        subscription_status: 'active',
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Add user as owner/admin
    const { error: memberError } = await supabaseServer
      .from('team_members')
      .insert({
        organization_id: org.id,
        email,
        name: name,
        role: 'admin',
        is_owner: true,
      })

    if (memberError) throw memberError

    return org
  } catch (error) {
    console.error('Error creating organization:', error)
    throw error
  }
}

/**
 * Add team member to organization
 */
export async function addTeamMember(
  organizationId: string,
  email: string,
  name: string,
  role: 'admin' | 'manager' | 'member' | 'viewer' = 'member'
) {
  try {
    const { data, error } = await supabaseServer
      .from('team_members')
      .insert({
        organization_id: organizationId,
        email,
        name,
        role,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding team member:', error)
    throw error
  }
}

/**
 * Get organization team members
 */
export async function getTeamMembers(organizationId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting team members:', error)
    return []
  }
}

/**
 * Update organization settings
 */
export async function updateOrganization(
  organizationId: string,
  updates: {
    name?: string
    website?: string
    logo_url?: string
    whatsapp_phone_number?: string
    whatsapp_configured?: boolean
    gemini_configured?: boolean
  }
) {
  try {
    const { data, error } = await supabaseServer
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating organization:', error)
    throw error
  }
}

/**
 * Get organization subscription info
 */
export async function getSubscriptionInfo(organizationId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_end_date, max_conversations, max_products, max_team_members')
      .eq('id', organizationId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting subscription info:', error)
    return null
  }
}

/**
 * Check if organization has reached limits
 */
export async function checkOrganizationLimits(
  organizationId: string,
  resource: 'conversations' | 'products' | 'team_members'
) {
  try {
    const subscription = await getSubscriptionInfo(organizationId)
    if (!subscription) return false

    let count = 0
    let limit = 0

    if (resource === 'conversations') {
      const { count: c } = await supabaseServer
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
      count = c || 0
      limit = subscription.max_conversations
    } else if (resource === 'products') {
      const { count: c } = await supabaseServer
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
      count = c || 0
      limit = subscription.max_products
    } else if (resource === 'team_members') {
      const { count: c } = await supabaseServer
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
      count = c || 0
      limit = subscription.max_team_members
    }

    return count >= limit
  } catch (error) {
    console.error('Error checking limits:', error)
    return false
  }
}

/**
 * Log activity for audit trail
 */
export async function logActivity(
  organizationId: string,
  userId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  changes?: Record<string, unknown>
) {
  try {
    await supabaseServer.from('activity_logs').insert({
      organization_id: organizationId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes: changes || {},
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

/**
 * Get activity logs for organization
 */
export async function getActivityLogs(organizationId: string, limit = 50) {
  try {
    const { data, error } = await supabaseServer
      .from('activity_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting activity logs:', error)
    return []
  }
}
