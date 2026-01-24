/**
 * WhatsApp Webhook Endpoint (Multi-tenant)
 *
 * This endpoint receives incoming messages from WhatsApp Cloud API.
 *
 * Multi-tenant strategy (Option A): 1 WhatsApp number per customer (organization).
 * We identify the tenant by `value.metadata.phone_number_id` present in the webhook payload.
 *
 * GET: Webhook verification from WhatsApp
 * POST: Incoming messages and events
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  parseWhatsAppWebhook,
  verifyWebhookToken,
  sendWhatsAppMessage,
  markMessageAsReadForTenant,
  getWhatsAppMediaUrl,
  downloadWhatsAppMedia,
} from '@/lib/whatsapp/client'
import { supabaseServer } from '@/lib/supabase/client'
import { analyzeMessage, analyzePaymentReceipt } from '@/lib/gemini/client'
import { resolveTenantByPhoneNumberId } from '@/lib/whatsapp/tenant'
import {
  createSalesSystemPrompt,
  isCartCommand,
  handleCartCommand,
  getEnrichedProducts,
} from '@/lib/sales-bot'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token && verifyWebhookToken(token)) {
      console.log('✅ Webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    }

    console.warn('❌ Webhook verification failed - invalid token')
    return new NextResponse('Forbidden', { status: 403 })
  } catch (error) {
    console.error('Error in webhook verification:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedMessage = parseWhatsAppWebhook(body)

    // Not a message event
    if (!parsedMessage) {
      return new NextResponse('OK', { status: 200 })
    }

    const { messageId, fromPhoneNumber, messageText, type, phoneNumberId, mediaId, mimeType } =
      parsedMessage

    console.log(
      `📨 Incoming message | phone_number_id=${phoneNumberId} | from=${fromPhoneNumber} | type=${type} | text=${messageText}`
    )

    // 1) Resolve tenant (organization) by WhatsApp phone_number_id
    const tenant = await resolveTenantByPhoneNumberId(phoneNumberId)
    if (!tenant) {
      // IMPORTANT: we still ACK to avoid retries; but we log loudly.
      console.error(
        `❌ No organization mapped for phone_number_id=${phoneNumberId}. Configure organizations.whatsapp_phone_number_id.`
      )
      return new NextResponse('OK', { status: 200 })
    }

    const organizationId = tenant.organizationId

    // 2) Mark message as read (best-effort)
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
      if (accessToken) {
        await markMessageAsReadForTenant(messageId, {
          phoneNumberId: tenant.phoneNumberId,
          accessToken,
        })
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }

    // 3) Get or create customer (scoped by organization)
    let customer = await supabaseServer
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('phone_number', fromPhoneNumber)
      .single()

    if (customer.error) {
      const createResult = await supabaseServer
        .from('customers')
        .insert({
          organization_id: organizationId,
          phone_number: fromPhoneNumber,
          name: `Customer ${fromPhoneNumber}`,
          status: 'prospect',
          source: 'whatsapp',
        })
        .select()
        .single()

      if (createResult.error) {
        throw new Error(`Failed to create customer: ${createResult.error.message}`)
      }

      customer = createResult
    }

    const customerId = customer.data.id

    // 4) Get or create active conversation (scoped by organization)
    let conversation = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (conversation.error) {
      const createConvResult = await supabaseServer
        .from('conversations')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          title: `Chat with ${customer.data.name}`,
          status: 'active',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createConvResult.error) {
        throw new Error(`Failed to create conversation: ${createConvResult.error.message}`)
      }

      conversation = createConvResult
    } else {
      // Update last_message_at
      await supabaseServer
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.data.id)
    }

    const conversationId = conversation.data.id

    // 5) Check if this is an image (potential payment receipt)
    if (type === 'image' && mediaId) {
      console.log('📸 Image received, checking for payment receipt...')

      // Check if customer has a pending payment
      const { data: pendingPayment } = await supabaseServer
        .from('payment_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingPayment) {
        // Process payment receipt
        console.log('💳 Processing payment receipt for transaction:', pendingPayment.id)

        try {
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''

          // Download the image from WhatsApp
          const mediaUrl = await getWhatsAppMediaUrl(mediaId, accessToken)
          const imageBase64 = await downloadWhatsAppMedia(mediaUrl, accessToken)

          // Analyze the receipt with Gemini Vision
          const receiptAnalysis = await analyzePaymentReceipt(
            `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
            pendingPayment.amount
          )

          // Store receipt (use media URL for reference)
          await supabaseServer.from('payment_receipts').insert({
            organization_id: organizationId,
            payment_transaction_id: pendingPayment.id,
            image_url: mediaUrl,
            image_type: receiptAnalysis.paymentMethod || 'other',
            ai_analysis: receiptAnalysis as unknown as Record<string, unknown>,
            ai_confidence: receiptAnalysis.confidence,
            extracted_amount: receiptAnalysis.extractedAmount,
            extracted_date: receiptAnalysis.extractedDate,
            extracted_reference: receiptAnalysis.extractedReference,
            is_verified: false,
          })

          // Update payment status
          if (receiptAnalysis.isValid && receiptAnalysis.confidence >= 0.7) {
            await supabaseServer
              .from('payment_transactions')
              .update({ status: 'processing' })
              .eq('id', pendingPayment.id)

            const response = `✅ ¡Recibimos tu comprobante de pago!\n\n📊 **Análisis:**\n- Monto detectado: S/ ${receiptAnalysis.extractedAmount}\n- Referencia: ${receiptAnalysis.extractedReference || 'N/A'}\n- Confianza: ${Math.round(receiptAnalysis.confidence * 100)}%\n\nTu pago está en verificación. Te confirmaremos en breve. ⏳`

            await sendWhatsAppMessage(fromPhoneNumber, response, {
              phoneNumberId: tenant.phoneNumberId,
              accessToken,
            })
          } else {
            const warnings = receiptAnalysis.warnings.join('\n- ')
            const response = `⚠️ Recibimos tu comprobante, pero hay algunos detalles que revisar:\n\n${warnings}\n\nNuestro equipo lo verificará manualmente. Te confirmaremos pronto.`

            await sendWhatsAppMessage(fromPhoneNumber, response, {
              phoneNumberId: tenant.phoneNumberId,
              accessToken,
            })
          }

          return new NextResponse('OK', { status: 200 })
        } catch (error) {
          console.error('Error processing payment receipt:', error)
        }
      }
    }

    // 6) Store incoming message (scoped by organization)
    await supabaseServer.from('messages').insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      sender_type: 'customer',
      content: messageText,
      message_type: type,
      whatsapp_message_id: messageId,
      metadata: {
        whatsapp_phone_number_id: phoneNumberId,
        media_id: mediaId,
        mime_type: mimeType,
      },
    })

    // 7) Check if this is a cart command
    const cartCommandCheck = isCartCommand(messageText)

    let aiResponse: string

    if (cartCommandCheck.isCommand && cartCommandCheck.command) {
      console.log('🛒 Cart command detected:', cartCommandCheck.command)

      // Handle cart command
      aiResponse = await handleCartCommand(
        cartCommandCheck.command,
        organizationId,
        customerId,
        cartCommandCheck.productQuery
      )
    } else {
      // 8) AI analysis & context
      const analysis = await analyzeMessage(messageText)

      const { data: messageHistory } = await supabaseServer
        .from('messages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10)

      const conversationContext =
        messageHistory?.map((msg) => ({
          role: msg.sender_type === 'customer' ? 'customer' : 'agent',
          content: msg.content,
        })) || []

      // Get enriched products with variants and features
      const products = await getEnrichedProducts(organizationId)

      // Get enhanced system prompt with all sales info
      const systemPrompt = await createSalesSystemPrompt(organizationId)

      // 9) Generate AI response with sales context
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const chat = model.startChat({
        history: conversationContext.map((msg) => ({
          role: msg.role === 'customer' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        systemInstruction: systemPrompt,
      })

      const result = await chat.sendMessage(messageText)
      aiResponse = result.response.text()

      // 10) Optional: promote prospect to customer
      if (analysis.intent === 'purchase') {
        await supabaseServer
          .from('customers')
          .update({ status: 'customer' })
          .eq('organization_id', organizationId)
          .eq('id', customerId)
      }
    }

    // 11) Store AI response
    await supabaseServer.from('messages').insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      sender_type: 'agent',
      content: aiResponse,
      message_type: 'text',
      metadata: {},
    })

    // 12) Send response back via WhatsApp (using tenant phone_number_id)
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
      await sendWhatsAppMessage(fromPhoneNumber, aiResponse, {
        phoneNumberId: tenant.phoneNumberId,
        accessToken: accessToken || undefined,
      })
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Always ACK to prevent retries storms
    return new NextResponse('OK', { status: 200 })
  }
}
