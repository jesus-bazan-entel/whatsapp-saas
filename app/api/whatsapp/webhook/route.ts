/**
 * WhatsApp Webhook Endpoint
 * 
 * This endpoint receives incoming messages and status updates from WhatsApp Business API.
 * It processes messages, stores them in Supabase, and generates AI responses.
 * 
 * GET: Webhook verification from WhatsApp
 * POST: Incoming messages and events
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseWhatsAppWebhook, verifyWebhookToken, sendWhatsAppMessage, markMessageAsRead } from '@/lib/whatsapp/client'
import { supabaseServer } from '@/lib/supabase/client'
import { generateAIResponse, analyzeMessage } from '@/lib/gemini/client'

/**
 * GET handler for webhook verification
 * WhatsApp sends a verification request with a token and challenge
 * We must respond with the challenge if the token matches
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // Verify the webhook token
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

/**
 * POST handler for incoming messages and events
 * Processes incoming WhatsApp messages and generates AI responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Parse the incoming webhook
    const parsedMessage = parseWhatsAppWebhook(body)

    // If not a message event, acknowledge and return
    if (!parsedMessage) {
      console.log('Received non-message event, acknowledging')
      return new NextResponse('OK', { status: 200 })
    }

    const { messageId, fromPhoneNumber, messageText, timestamp, type } = parsedMessage

    console.log(`📨 Received message from ${fromPhoneNumber}: ${messageText}`)

    // Mark message as read
    try {
      await markMessageAsRead(messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }

    // Step 1: Get or create customer
    let customer = await supabaseServer
      .from('customers')
      .select('*')
      .eq('phone_number', fromPhoneNumber)
      .single()

    if (customer.error) {
      // Customer doesn't exist, create new one
      const createResult = await supabaseServer
        .from('customers')
        .insert({
          phone_number: fromPhoneNumber,
          name: `Customer ${fromPhoneNumber}`,
          status: 'prospect',
        })
        .select()
        .single()

      if (createResult.error) {
        throw new Error(`Failed to create customer: ${createResult.error.message}`)
      }

      customer = createResult
    }

    const customerId = customer.data.id

    // Step 2: Get or create conversation
    let conversation = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (conversation.error) {
      // No active conversation, create new one
      const createConvResult = await supabaseServer
        .from('conversations')
        .insert({
          customer_id: customerId,
          title: `Chat with ${customer.data.name}`,
          status: 'active',
        })
        .select()
        .single()

      if (createConvResult.error) {
        throw new Error(`Failed to create conversation: ${createConvResult.error.message}`)
      }

      conversation = createConvResult
    }

    const conversationId = conversation.data.id

    // Step 3: Store the incoming message
    await supabaseServer.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      content: messageText,
      message_type: type,
    })

    // Step 4: Analyze message sentiment and intent
    const analysis = await analyzeMessage(messageText)
    console.log(`📊 Message analysis:`, analysis)

    // Step 5: Get conversation history for context
    const { data: messageHistory } = await supabaseServer
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    const conversationContext = messageHistory?.map((msg) => ({
      role: msg.sender_type === 'customer' ? 'customer' : 'agent',
      content: msg.content,
    })) || []

    // Step 6: Get available products for recommendations
    const { data: products } = await supabaseServer
      .from('products')
      .select('*')
      .limit(10)

    // Step 7: Generate AI response
    const aiResponse = await generateAIResponse(
      messageText,
      conversationContext,
      products || []
    )

    console.log(`🤖 AI Response: ${aiResponse}`)

    // Step 8: Store the AI response
    await supabaseServer.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'agent',
      content: aiResponse,
      message_type: 'text',
    })

    // Step 9: Send response via WhatsApp
    try {
      await sendWhatsAppMessage(fromPhoneNumber, aiResponse)
      console.log(`✅ Message sent to ${fromPhoneNumber}`)
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
    }

    // Step 10: Update customer status based on analysis
    if (analysis.intent === 'purchase') {
      await supabaseServer
        .from('customers')
        .update({ status: 'customer' })
        .eq('id', customerId)
    }

    // Acknowledge the webhook
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Always return 200 to acknowledge the webhook, even on error
    return new NextResponse('OK', { status: 200 })
  }
}
