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
  image?: { caption?: string; id?: string; mime_type?: string; sha256?: string }
  document?: { caption?: string; id?: string; mime_type?: string; sha256?: string }
  video?: { caption?: string; id?: string; mime_type?: string; sha256?: string }
  audio?: { id?: string; mime_type?: string; sha256?: string }
  location?: { latitude?: number; longitude?: number }
}

export function parseWhatsAppWebhook(body: unknown): {
  messageId: string
  fromPhoneNumber: string
  messageText: string
  timestamp: number
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'unknown'
  phoneNumberId?: string
  mediaId?: string
  mediaUrl?: string
  mimeType?: string
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
    let mediaId: string | undefined
    let mimeType: string | undefined

    if (msg.type === 'text') {
      messageText = msg.text?.body || ''
      messageType = 'text'
    } else if (msg.type === 'image') {
      messageText = msg.image?.caption || '[Image received]'
      messageType = 'image'
      mediaId = msg.image?.id
      mimeType = msg.image?.mime_type
    } else if (msg.type === 'document') {
      messageText = msg.document?.caption || '[Document received]'
      messageType = 'document'
      mediaId = msg.document?.id
      mimeType = msg.document?.mime_type
    } else if (msg.type === 'audio') {
      messageText = '[Audio message received]'
      messageType = 'audio'
      mediaId = msg.audio?.id
      mimeType = msg.audio?.mime_type
    } else if (msg.type === 'video') {
      messageText = msg.video?.caption || '[Video received]'
      messageType = 'video'
      mediaId = msg.video?.id
      mimeType = msg.video?.mime_type
    } else if (msg.type === 'location') {
      const lat = msg.location?.latitude
      const lng = msg.location?.longitude
      messageText = '[Location: ' + (lat ?? '') + ', ' + (lng ?? '') + ']'
      messageType = 'location'
    } else {
      messageText = '[Unsupported message type]'
      messageType = 'unknown'
    }

    // If we have a mediaId, we'll need to fetch the URL using WhatsApp API
    // For now, we'll return the mediaId and let the caller fetch the URL
    // The URL fetching requires an authenticated API call
    let mediaUrl: string | undefined
    if (mediaId && phoneNumberId) {
      // We'll set a placeholder that indicates the media needs to be fetched
      mediaUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${mediaId}`
    }

    return {
      messageId: msg.id,
      fromPhoneNumber: contact.wa_id,
      messageText,
      timestamp: Number(msg.timestamp),
      type: messageType,
      phoneNumberId,
      mediaId,
      mediaUrl,
      mimeType,
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

/**
 * Get media URL from WhatsApp
 * First, get the media URL from the media ID, then download the actual file
 *
 * @param mediaId - The media ID from the webhook
 * @param accessToken - Access token for authentication
 * @returns The media URL that can be downloaded
 */
export async function getWhatsAppMediaUrl(
  mediaId: string,
  accessToken: string
): Promise<string> {
  try {
    // Step 1: Get media info (includes URL)
    const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${mediaId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${error.error?.message}`)
    }

    const data = await response.json() as { url?: string }
    return data.url || ''
  } catch (error) {
    console.error('Error getting WhatsApp media URL:', error)
    throw error
  }
}

/**
 * Download media from WhatsApp and convert to base64
 *
 * @param mediaUrl - The media URL from getWhatsAppMediaUrl
 * @param accessToken - Access token for authentication
 * @returns Base64 encoded media data
 */
export async function downloadWhatsAppMedia(
  mediaUrl: string,
  accessToken: string
): Promise<string> {
  try {
    const response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return base64
  } catch (error) {
    console.error('Error downloading WhatsApp media:', error)
    throw error
  }
}
