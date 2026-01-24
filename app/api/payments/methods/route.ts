/**
 * Payment Methods API
 *
 * Manages payment methods configuration for each organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET - List all active payment methods for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    // Get organization from query params or session
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get all active payment methods
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('method_type')

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      methods,
    })
  } catch (error) {
    console.error('Error in GET /api/payments/methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new payment method
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body = await request.json()
    const {
      organizationId,
      methodType,
      name,
      description,
      config,
      requiresProof,
      instructions,
    } = body

    if (!organizationId || !methodType || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment method
    const { data: method, error } = await supabase
      .from('payment_methods')
      .insert({
        organization_id: organizationId,
        method_type: methodType,
        name,
        description,
        config,
        requires_proof: requiresProof ?? false,
        instructions,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment method:', error)
      return NextResponse.json(
        { error: 'Failed to create payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      method,
    })
  } catch (error) {
    console.error('Error in POST /api/payments/methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a payment method
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body = await request.json()
    const { methodId, isActive, config, instructions, description } = body

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 })
    }

    // Update payment method
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof isActive === 'boolean') updateData.is_active = isActive
    if (config) updateData.config = config
    if (instructions !== undefined) updateData.instructions = instructions
    if (description !== undefined) updateData.description = description

    const { data: method, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', methodId)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment method:', error)
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      method,
    })
  } catch (error) {
    console.error('Error in PATCH /api/payments/methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
