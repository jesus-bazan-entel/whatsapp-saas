/**
 * Admin Organizations API
 * 
 * Endpoints for managing customer organizations
 * Only accessible to super admin (you)
 */

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'
import { createOrganization } from '@/lib/supabase/auth'

/**
 * GET /api/admin/organizations
 * List all organizations
 */
export async function GET() {
  try {
    // TODO: Add admin authentication check
    
    const { data, error } = await supabaseServer
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/organizations
 * Create new organization
 */
export async function POST(request: Request) {
  try {
    // TODO: Add admin authentication check
    
    const { name, email, phone, website } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create organization
    const org = await createOrganization(name, email, phone, website)

    return NextResponse.json(org, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
