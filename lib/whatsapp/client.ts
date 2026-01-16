/**
 * WhatsApp Business API Integration
 * 
 * This module handles all WhatsApp Business API operations:
 * - Sending messages to customers
 * - Receiving and parsing incoming messages
 * - Managing message status updates
 * - Handling webhook events
 */

const WHATSAPP_API_VERSION = 'v19.0'
const WHATSAPP_API_URL = 'https://graph.facebook.com'

/**
 * Send a text message via WhatsApp Business API
 * 
 * @param toPhoneNumber - Recipient phone number (with country code, no +)
 * @param messageText - The message content to send
 * @param opts - Optional overrides for multi-tenant (phoneNumberId, accessToken)
 * @returns Response from WhatsApp API
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  messageText: string,
  opts?: {
    phoneNumberId?: string
    accessToken?: string
  }
): Promise<unknown> {
  try {
    const phoneNumberId = opts?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = opts?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured')
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhoneNumber,
      type: 'text',
      text: {
        body: messageText,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('WhatsApp API error:', error)
      throw new Error(`WhatsApp API error: ${error.error?.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

/**
 * Send a template message via WhatsApp Business API
 * Useful for sending pre-approved marketing messages
 * 
 * @param toPhoneNumber - Recipient phone number
 * @param templateName - Name of the template
 * @param templateLanguage - Language code (e.g., 'en')
 * @param parameters - Template parameters
 * @returns Response from WhatsApp API
 */
export async function sendWhatsAppTemplate(
  toPhoneNumber: string,
  templateName: string,
  templateLanguage: string = 'en',
  parameters: string[] = []
): Promise<unknown> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured')
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        ...(parameters.length > 0 && {
          parameters: {
            body: {
              parameters: parameters.map((p) => ({ type: 'text', text: p })),
            },
          },
        }),
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${error.error?.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp template:', error)
    throw error
  }
}

/**
 * Parse incoming webhook event from WhatsApp
 * Extracts message content and metadata
 * 
 * @param body - The webhook request body
 * @returns Parsed message data or null if not a message event
 */
export function parseWhatsAppWebhook(body: any): {
  messageId: string
  fromPhoneNumber: string
  messageText: string
  timestamp: number
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'unknown'
  phoneNumberId?: string
} | null {
  try {
    // Navigate through the webhook structure
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    // Check if this is a message event
    if (!value?.messages || value.messages.length === 0) {
      return null
    }

    const message = value.messages[0]
    const contact = value.contacts?.[0]
    
    // Extract the phone_number_id that received the message (critical for multi-tenant)
    const phoneNumberId = value?.metadata?.phone_number_id

    if (!message || !contact) {
      return null
    }

    // Extract message content based on type
    let messageText = ''
    let messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'unknown' = 'unknown'

    if (message.type === 'text') {
      messageText = message.text?.body || ''
      messageType = 'text'
    } else if (message.type === 'image') {
      messageText = message.image?.caption || '[Image received]'
      messageType = 'image'
    } else if (message.type === 'document') {
      messageText = message.document?.caption || '[Document received]'
      messageType = 'document'
    } else if (message.type === 'audio') {
      messageText = '[Audio message received]'
      messageType = 'audio'
    } else if (message.type === 'video') {
      messageText = message.video?.caption || '[Video received]'
      messageType = 'video'
    } else if (message.type === 'location') {
      const loc = message.location
      messageText = `[Location: ${loc?.latitude}, ${loc?.longitude}]`
      messageType = 'location'
    }

    return {
      messageId: message.id,
      fromPhoneNumber: contact.wa_id,
      messageText,
      timestamp: message.timestamp,
      type: messageType,
      phoneNumberId,
    }
  } catch (error) {
    console.error('Error parsing WhatsApp webhook:', error)
    return null
  }
}

/**
 * Verify webhook token from WhatsApp
 * Called by WhatsApp to verify the webhook endpoint
 * 
 * @param token - The token from the webhook verification request
 * @returns true if token matches, false otherwise
 */
export function verifyWebhookToken(token: string): boolean {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  return token === verifyToken
}

/**
 * Mark a message as read in WhatsApp
 * 
 * @param messageId - The ID of the message to mark as read
 * @returns Response from WhatsApp API
 */
export async function markMessageAsRead(messageId: string): Promise<unknown> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured')
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${error.error?.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

/**
 * Mark a message as read for a specific tenant
 * 
 * @param messageId - The ID of the message to mark as read
 * @param opts - Tenant credentials (phoneNumberId, accessToken)
 * @returns Response from WhatsApp API
 */
export async function markMessageAsReadForTenant(
  messageId: string,
  opts: { phoneNumberId: string; accessToken: string }
): Promise<unknown> {
  const { phoneNumberId, accessToken } = opts
  if (!phoneNumberId || !accessToken) throw new Error('WhatsApp tenant credentials not configured')

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`
  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${error.error?.message}`)
  }

  return await response.json()
}
