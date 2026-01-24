/**
 * Sales Bot Logic
 *
 * Handles the sales flow via WhatsApp:
 * 1. Product inquiry & recommendations
 * 2. Add to cart
 * 3. Delivery selection
 * 4. Payment method selection
 * 5. Order confirmation
 * 6. Payment verification
 */

import { supabaseServer } from '@/lib/supabase/client'
import { generateAIResponse } from '@/lib/gemini/client'

/**
 * Get enriched product information with variants and features
 */
export async function getEnrichedProducts(organizationId: string) {
  const { data: products } = await supabaseServer
    .from('products')
    .select(
      `
      *,
      product_variants (*),
      product_features (*)
    `
    )
    .eq('organization_id', organizationId)
    .limit(20)

  return products || []
}

/**
 * Format product information for AI context
 */
export function formatProductsForAI(
  products: Array<{
    id: string
    name: string
    description: string
    price: number
    category: string
    product_variants?: Array<{
      name: string
      size?: string
      color?: string
      stock_quantity: number
      price_adjustment: number
      is_available: boolean
    }>
    product_features?: Array<{
      feature_name: string
      feature_value: string
      is_highlight: boolean
    }>
  }>
): string {
  return products
    .map((product) => {
      let productText = `**${product.name}**
- Precio: S/ ${product.price}
- Categoría: ${product.category || 'General'}
- Descripción: ${product.description || 'Sin descripción'}`

      // Add features
      if (product.product_features && product.product_features.length > 0) {
        productText += '\n- Características:'
        product.product_features
          .filter((f) => f.is_highlight)
          .forEach((feature) => {
            productText += `\n  • ${feature.feature_name}: ${feature.feature_value}`
          })
      }

      // Add variants (sizes, colors)
      if (product.product_variants && product.product_variants.length > 0) {
        const availableVariants = product.product_variants.filter(
          (v) => v.is_available && v.stock_quantity > 0
        )

        if (availableVariants.length > 0) {
          productText += '\n- Variantes disponibles:'
          availableVariants.forEach((variant) => {
            const priceWithAdjustment = product.price + variant.price_adjustment
            productText += `\n  • ${variant.name} - S/ ${priceWithAdjustment} (Stock: ${variant.stock_quantity})`
          })
        }
      }

      return productText
    })
    .join('\n\n')
}

/**
 * Get payment methods information
 */
export async function getPaymentMethodsInfo(organizationId: string): Promise<string> {
  const { data: methods } = await supabaseServer
    .from('payment_methods')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (!methods || methods.length === 0) {
    return 'No hay métodos de pago configurados.'
  }

  let text = 'Métodos de pago disponibles:\n'
  methods.forEach((method, index) => {
    text += `\n${index + 1}. **${method.name}**`
    if (method.description) {
      text += `\n   ${method.description}`
    }
  })

  return text
}

/**
 * Get delivery zones information
 */
export async function getDeliveryZonesInfo(organizationId: string): Promise<string> {
  const { data: zones } = await supabaseServer
    .from('delivery_zones')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (!zones || zones.length === 0) {
    return 'No hay zonas de delivery configuradas.'
  }

  let text = 'Zonas de delivery:\n'
  zones.forEach((zone, index) => {
    text += `\n${index + 1}. **${zone.name}** - S/ ${zone.cost}`
    if (zone.estimated_days) {
      text += ` (${zone.estimated_days} ${zone.estimated_days === 1 ? 'día' : 'días'})`
    }
    if (zone.areas && zone.areas.length > 0) {
      text += `\n   Áreas: ${zone.areas.slice(0, 5).join(', ')}`
      if (zone.areas.length > 5) {
        text += `, y ${zone.areas.length - 5} más`
      }
    }
  })

  return text
}

/**
 * Create enhanced AI system prompt with complete sales information
 */
export async function createSalesSystemPrompt(organizationId: string): Promise<string> {
  const products = await getEnrichedProducts(organizationId)
  const productsText = formatProductsForAI(products)
  const paymentMethodsText = await getPaymentMethodsInfo(organizationId)
  const deliveryZonesText = await getDeliveryZonesInfo(organizationId)

  return `Eres un asistente de ventas profesional y amigable por WhatsApp. Tu objetivo es ayudar a los clientes a:
1. Descubrir productos que necesitan
2. Responder preguntas sobre características, tallas, precios
3. Agregar productos al carrito
4. Completar la compra con pago y delivery

CATÁLOGO DE PRODUCTOS:
${productsText}

${paymentMethodsText}

${deliveryZonesText}

INSTRUCCIONES IMPORTANTES:
- Sé conversacional, amigable y profesional
- Responde de forma concisa (2-4 oraciones máximo)
- Si el cliente pregunta por un producto, menciona el precio, características principales y variantes disponibles
- Si el cliente quiere comprar, pregunta por la variante (talla/color) si aplica
- Siempre confirma antes de agregar items al carrito
- Cuando menciones precios, usa "S/" para soles peruanos
- Si no tienes información específica, sé honesto y ofrece alternativas

COMANDOS DEL CLIENTE:
- "ver carrito" o "mi carrito" → Muestra el contenido del carrito
- "agregar [producto]" → Agrega un producto al carrito
- "comprar" o "finalizar compra" → Inicia el proceso de checkout
- "métodos de pago" → Lista los métodos de pago disponibles
- "delivery" o "envío" → Información sobre zonas de delivery

Mantén un tono amigable, usa emojis ocasionalmente 🛍️ 📦 💳 pero sin exagerar.`
}

/**
 * Generate AI response with enhanced sales context
 */
export async function generateSalesResponse(
  organizationId: string,
  customerMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const systemPrompt = await createSalesSystemPrompt(organizationId)

  // Use the enhanced system prompt
  const products = await getEnrichedProducts(organizationId)

  return generateAIResponse(
    customerMessage,
    conversationHistory,
    products.map((p) => ({
      name: p.name,
      description: p.description || '',
      price: p.price,
    }))
  )
}

/**
 * Check if message is a cart-related command
 */
export function isCartCommand(message: string): {
  isCommand: boolean
  command: 'view_cart' | 'add_to_cart' | 'checkout' | 'payment_methods' | 'delivery_info' | null
  productQuery?: string
} {
  const lowerMessage = message.toLowerCase().trim()

  // View cart
  if (
    lowerMessage.includes('ver carrito') ||
    lowerMessage.includes('mi carrito') ||
    lowerMessage === 'carrito'
  ) {
    return { isCommand: true, command: 'view_cart' }
  }

  // Checkout
  if (
    lowerMessage.includes('comprar') ||
    lowerMessage.includes('finalizar') ||
    lowerMessage.includes('checkout')
  ) {
    return { isCommand: true, command: 'checkout' }
  }

  // Payment methods
  if (
    lowerMessage.includes('métodos de pago') ||
    lowerMessage.includes('metodos de pago') ||
    lowerMessage.includes('cómo pagar') ||
    lowerMessage.includes('como pagar') ||
    lowerMessage.includes('formas de pago')
  ) {
    return { isCommand: true, command: 'payment_methods' }
  }

  // Delivery info
  if (
    lowerMessage.includes('delivery') ||
    lowerMessage.includes('envío') ||
    lowerMessage.includes('envio') ||
    lowerMessage.includes('entrega')
  ) {
    return { isCommand: true, command: 'delivery_info' }
  }

  // Add to cart (more complex - needs product matching)
  if (lowerMessage.includes('agregar') || lowerMessage.includes('añadir')) {
    const productQuery = lowerMessage
      .replace(/agregar|añadir|al carrito/gi, '')
      .trim()
    return { isCommand: true, command: 'add_to_cart', productQuery }
  }

  return { isCommand: false, command: null }
}

/**
 * Handle cart command
 */
export async function handleCartCommand(
  command: string,
  organizationId: string,
  customerId: string,
  productQuery?: string
): Promise<string> {
  switch (command) {
    case 'view_cart': {
      // Get customer's cart
      const { data: cart } = await supabaseServer
        .from('shopping_carts')
        .select(
          `
          *,
          cart_items (
            *,
            products (name, price),
            product_variants:variant_id (name)
          )
        `
        )
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
        return '🛒 Tu carrito está vacío.\n\n¿Quieres ver nuestro catálogo de productos?'
      }

      let response = '🛒 **Tu Carrito:**\n\n'
      cart.cart_items.forEach((item: {
        quantity: number
        products: { name: string; price: number }
        product_variants?: { name: string } | null
        total_price: number
      }, index: number) => {
        const variantInfo = item.product_variants ? ` - ${item.product_variants.name}` : ''
        response += `${index + 1}. ${item.products.name}${variantInfo}\n`
        response += `   Cantidad: ${item.quantity} × S/ ${item.products.price} = S/ ${item.total_price}\n\n`
      })

      response += `**Subtotal:** S/ ${cart.subtotal}\n`
      if (cart.delivery_cost > 0) {
        response += `**Delivery:** S/ ${cart.delivery_cost}\n`
      }
      response += `**TOTAL:** S/ ${cart.total}\n\n`
      response += '¿Deseas finalizar tu compra? Escribe "comprar" para continuar.'

      return response
    }

    case 'payment_methods': {
      const info = await getPaymentMethodsInfo(organizationId)
      return `💳 ${info}\n\n¿Tienes alguna pregunta sobre los métodos de pago?`
    }

    case 'delivery_info': {
      const info = await getDeliveryZonesInfo(organizationId)
      return `📦 ${info}\n\n¿A qué zona necesitas el envío?`
    }

    case 'checkout': {
      // Get customer's cart
      const { data: cart } = await supabaseServer
        .from('shopping_carts')
        .select('*, cart_items(*)')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
        return '🛒 Tu carrito está vacío. Agrega productos primero antes de finalizar la compra.'
      }

      // Start checkout process
      return `🛍️ ¡Perfecto! Vamos a finalizar tu compra.\n\n**Total a pagar:** S/ ${cart.total}\n\nPor favor, proporciónanos:\n1. Tu dirección de entrega\n2. ¿En qué zona te encuentras?\n\nLuego te mostraré los métodos de pago disponibles.`
    }

    default:
      return 'No entendí el comando. ¿En qué puedo ayudarte?'
  }
}
