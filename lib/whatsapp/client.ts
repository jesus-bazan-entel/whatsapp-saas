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

// WhatsApp API response type for send message
interface WhatsAppSendMessageResponse {
  messaging_product: string
  contacts?: Array<{ input: string; wa_id: string }>
  messages?: Array<{ id: string }>
}

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
): Promise<WhatsAppSendMessageResponse> {
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
/**
 * Parse incoming webhook event from WhatsApp
 * Extracts message content and metadata
 *
 * @param body - The webhook request body
 * @returns Parsed message data or null if not a message event
 */

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: WhatsAppWebhookValue
    }>
  }>
}

type WhatsAppWebhookValue = {
  metadata?: {
    phone_number_id?: string
  }
  messages?: WhatsAppWebhookMessage[]
  contacts?: WhatsAppWebhookContact[]
}

type WhatsAppWebhookContact = {
  wa_id: string
}

type WhatsAppWebhookMessage = {
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | string
  text?: { body?: string }
  image?: { caption?: string }
  document?: { caption?: string }
  video?: { caption?: string }
  location?: { latitude?: number; longitude?: number }
}

export function parseWhatsAppWebhook(body: unknown): {
  messageId: string
  fromPhoneNumber: string
  messageText: string
  timestamp: number
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'unknown'
  phoneNumberId?: string
} | null {
  try {
    const payload = body as WhatsAppWebhookPayload

    const entry = payload.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    const msg = value?.messages?.[0]
    const contact = value?.contacts?.[0]

    if (!msg || !contact) return null

    const phoneNumberId = value?.metadata?.phone_number_id

    // Extract message content based on type
    let messageText = ''
    let messageType:
      | 'text'
      | 'image'
      | 'document'
      | 'audio'
      | 'video'
      | 'location'
      | 'unknown' = 'unknown'

    if (msg.type === 'text') {
      messageText = msg.text?.body || ''
      messageType = 'text'
    } else if (msg.type === 'image') {
      messageText = msg.image?.caption || '[Image received]'
      messageType = 'image'
    } else if (msg.type === 'document') {
      messageText = msg.document?.caption || '[Document received]'
      messageType = 'document'
    } else if (msg.type === 'audio') {
      messageText = '[Audio message received]'
      messageType = 'audio'
    } else if (msg.type === 'video') {
      messageText = msg.video?.caption || '[Video received]'
      messageType = 'video'
    } else if (msg.type === 'location') {
      const lat = msg.location?.latitude
      const lng = msg.location?.longitude
      messageText = '[Location: ' + (lat ?? '') + ', ' + (lng ?? '') + ']'
      messageType = 'location'
    } else {
      messageText = '[Unsupported message type]'
      messageType = 'unknown'
    }

    return {
      messageId: msg.id,
      fromPhoneNumber: contact.wa_id,
      messageText,
      timestamp: Number(msg.timestamp),
      type: messageType,
      phoneNumberId,
    }
  } catch (error) {
    console.error('Error parsing WhatsApp webhook:', error)
    return null
  }
}

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
