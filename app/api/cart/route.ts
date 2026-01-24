/**
 * Shopping Cart API
 *
 * Manages customer shopping carts for WhatsApp sales bot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET - Get customer's active cart
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const organizationId = searchParams.get('organizationId')

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { error: 'Customer ID and Organization ID are required' },
        { status: 400 }
      )
    }

    // Get or create active cart
    let { data: cart, error } = await supabase
      .from('shopping_carts')
      .select(
        `
        *,
        cart_items (
          *,
          products (*),
          product_variants:variant_id (*)
        ),
        delivery_zones:delivery_zone_id (*)
      `
      )
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    // If no active cart, create one
    if (error || !cart) {
      const { data: newCart, error: createError } = await supabase
        .from('shopping_carts')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          status: 'active',
          subtotal: 0,
          delivery_cost: 0,
          total: 0,
        })
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
        .single()

      if (createError) {
        console.error('Error creating cart:', createError)
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
      }

      cart = newCart
    }

    return NextResponse.json({
      success: true,
      cart,
    })
  } catch (error) {
    console.error('Error in GET /api/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body = await request.json()
    const {
      customerId,
      organizationId,
      productId,
      variantId,
      quantity = 1,
      conversationId,
    } = body

    if (!customerId || !organizationId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get unit price (from variant if specified, otherwise from product)
    let unitPrice = product.price
    if (variantId) {
      const variant = product.product_variants?.find(
        (v: { id: string }) => v.id === variantId
      )
      if (variant) {
        unitPrice = product.price + (variant.price_adjustment || 0)
      }
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (!cart) {
      const { data: newCart, error: createError } = await supabase
        .from('shopping_carts')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          conversation_id: conversationId,
          status: 'active',
          subtotal: 0,
          delivery_cost: 0,
          total: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating cart:', createError)
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
      }

      cart = newCart
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .single()

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      const newTotal = unitPrice * newQuantity

      await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          total_price: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
    } else {
      // Add new item
      await supabase.from('cart_items').insert({
        organization_id: organizationId,
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
      })
    }

    // Recalculate cart totals
    const { data: items } = await supabase
      .from('cart_items')
      .select('total_price')
      .eq('cart_id', cart.id)

    const subtotal = items?.reduce((sum, item) => sum + parseFloat(String(item.total_price)), 0) || 0
    const deliveryCost = cart.delivery_cost || 0
    const total = subtotal + deliveryCost

    await supabase
      .from('shopping_carts')
      .update({
        subtotal,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id)

    // Get updated cart
    const { data: updatedCart } = await supabase
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
      .eq('id', cart.id)
      .single()

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Item added to cart',
    })
  } catch (error) {
    console.error('Error in POST /api/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove item from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const searchParams = request.nextUrl.searchParams
    const cartItemId = searchParams.get('itemId')
    const cartId = searchParams.get('cartId')

    if (!cartItemId || !cartId) {
      return NextResponse.json(
        { error: 'Cart item ID and cart ID are required' },
        { status: 400 }
      )
    }

    // Delete cart item
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)

    if (error) {
      console.error('Error deleting cart item:', error)
      return NextResponse.json(
        { error: 'Failed to delete cart item' },
        { status: 500 }
      )
    }

    // Recalculate cart totals
    const { data: items } = await supabase
      .from('cart_items')
      .select('total_price')
      .eq('cart_id', cartId)

    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('delivery_cost')
      .eq('id', cartId)
      .single()

    const subtotal = items?.reduce((sum, item) => sum + parseFloat(String(item.total_price)), 0) || 0
    const deliveryCost = cart?.delivery_cost || 0
    const total = subtotal + deliveryCost

    await supabase
      .from('shopping_carts')
      .update({
        subtotal,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId)

    // Get updated cart
    const { data: updatedCart } = await supabase
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
      .single()

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Item removed from cart',
    })
  } catch (error) {
    console.error('Error in DELETE /api/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update delivery info for cart
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body = await request.json()
    const { cartId, deliveryZoneId, deliveryAddress, deliveryNotes } = body

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 })
    }

    // Get delivery zone cost if zone is specified
    let deliveryCost = 0
    if (deliveryZoneId) {
      const { data: zone } = await supabase
        .from('delivery_zones')
        .select('cost')
        .eq('id', deliveryZoneId)
        .single()

      deliveryCost = zone?.cost || 0
    }

    // Get current cart
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('subtotal')
      .eq('id', cartId)
      .single()

    const total = (cart?.subtotal || 0) + deliveryCost

    // Update cart
    const { data: updatedCart, error } = await supabase
      .from('shopping_carts')
      .update({
        delivery_zone_id: deliveryZoneId,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes,
        delivery_cost: deliveryCost,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId)
      .select(
        `
        *,
        cart_items (
          *,
          products (*),
          product_variants:variant_id (*)
        ),
        delivery_zones:delivery_zone_id (*)
      `
      )
      .single()

    if (error) {
      console.error('Error updating cart delivery:', error)
      return NextResponse.json(
        { error: 'Failed to update cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Delivery info updated',
    })
  } catch (error) {
    console.error('Error in PATCH /api/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
