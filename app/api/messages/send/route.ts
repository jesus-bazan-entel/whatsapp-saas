/**
 * Send Message API Route
 * 
 * Allows manual sending of messages to customers via WhatsApp
 * Used by the dashboard to send messages and follow-ups
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, messageText, phoneNumber } = await request.json()

    if (!messageText || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: messageText, phoneNumber' },
        { status: 400 }
      )
    }

    // Send message via WhatsApp
    const result = await sendWhatsAppMessage(phoneNumber, messageText)

    // Store message in database
    if (conversationId) {
      await supabaseServer.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        content: messageText,
        message_type: 'text',
      })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
