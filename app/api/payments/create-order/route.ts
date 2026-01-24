/**
 * Create Order and Payment API
 *
 * Creates a sale order from a shopping cart and initiates payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface CreateOrderRequest {
  cartId: string
  paymentMethodId: string
  customerId: string
  organizationId: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body: CreateOrderRequest = await request.json()
    const { cartId, paymentMethodId, customerId, organizationId } = body

    if (!cartId || !paymentMethodId || !customerId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get shopping cart with items
    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select(
        `
        *,
        cart_items (
          *,
          products (*),
          product_variants:variant_id (*)
        )
      `
      )
      .eq('id', cartId)
      .eq('status', 'active')
      .single()

    if (cartError || !cart) {
      return NextResponse.json({ error: 'Cart not found or already processed' }, { status: 404 })
    }

    if (cart.cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Get conversation ID if exists
    const conversationId = cart.conversation_id

    // Create a sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        conversation_id: conversationId,
        total_amount: cart.total,
        status: 'pending',
        payment_method: paymentMethodId,
        metadata: {
          cart_id: cartId,
          delivery_zone_id: cart.delivery_zone_id,
          delivery_address: cart.delivery_address,
          delivery_notes: cart.delivery_notes,
          delivery_cost: cart.delivery_cost,
          subtotal: cart.subtotal,
        },
      })
      .select()
      .single()

    if (saleError) {
      console.error('Error creating sale:', saleError)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }

    // Create sale items
    const saleItems = cart.cart_items.map((item: {
      product_id: string
      quantity: number
      unit_price: number
      total_price: number
    }) => ({
      organization_id: organizationId,
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

    if (itemsError) {
      console.error('Error creating sale items:', itemsError)
      // Rollback: delete the sale
      await supabase.from('sales').delete().eq('id', sale.id)
      return NextResponse.json({ error: 'Failed to create sale items' }, { status: 500 })
    }

    // Get payment method details
    const { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single()

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        organization_id: organizationId,
        sale_id: sale.id,
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        amount: cart.total,
        currency: 'PEN',
        status: 'pending',
        payment_provider: paymentMethod?.method_type === 'online' ? 'stripe' : 'manual',
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError)
      // Rollback
      await supabase.from('sale_items').delete().eq('sale_id', sale.id)
      await supabase.from('sales').delete().eq('id', sale.id)
      return NextResponse.json(
        { error: 'Failed to create payment transaction' },
        { status: 500 }
      )
    }

    // Mark cart as converted
    await supabase
      .from('shopping_carts')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId)

    // Update customer status to 'customer' if they were a prospect
    await supabase
      .from('customers')
      .update({ status: 'customer' })
      .eq('id', customerId)
      .eq('status', 'prospect')

    // Log activity
    await supabase.from('activity_logs').insert({
      organization_id: organizationId,
      entity_type: 'sale',
      entity_id: sale.id,
      action: 'created',
      changes: {
        total_amount: sale.total_amount,
        items_count: saleItems.length,
      },
    })

    // Return order details with payment instructions
    return NextResponse.json({
      success: true,
      order: {
        id: sale.id,
        total: cart.total,
        status: sale.status,
        items: cart.cart_items,
      },
      payment: {
        id: transaction.id,
        status: transaction.status,
        method: paymentMethod,
        instructions: paymentMethod?.instructions,
        requiresProof: paymentMethod?.requires_proof,
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
