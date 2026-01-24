/**
 * Gemini 3 AI Integration
 * 
 * This module provides natural language processing capabilities using Google's Gemini 3 API.
 * It's used to generate intelligent responses for customer inquiries and sales conversations.
 * 
 * Features:
 * - Product recommendations based on customer queries
 * - Natural language responses for sales inquiries
 * - Context-aware conversations using conversation history
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * System prompt for the sales agent
 * Defines the behavior and personality of the AI agent
 */
const SYSTEM_PROMPT = `You are a professional sales agent for an e-commerce business. Your role is to:
1. Help customers find products that match their needs
2. Answer questions about products, pricing, and availability
3. Provide personalized recommendations
4. Guide customers through the buying process
5. Be friendly, professional, and helpful

When responding:
- Keep responses concise and natural (2-3 sentences max)
- Ask clarifying questions if needed
- Suggest relevant products when appropriate
- Always be honest about product features and limitations
- Maintain a conversational tone

If you don't have information about a specific product, ask the customer for more details or suggest they contact support.`

/**
 * Generate an AI response for a customer message
 * 
 * @param customerMessage - The message from the customer
 * @param conversationHistory - Previous messages in the conversation for context
 * @param products - Available products to recommend from
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  customerMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  products: Array<{ name: string; description: string; price: number }> = []
): Promise<string> {
  try {
    // Build product context for the AI
    const productContext = products.length > 0
      ? `\n\nAvailable products:\n${products
          .map((p) => `- ${p.name}: ${p.description} ($${p.price})`)
          .join('\n')}`
      : ''

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    // Build conversation history for context
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'customer' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: customerMessage }],
      },
    ]

    // Generate response using Gemini
    const chat = model.startChat({
      history: messages.slice(0, -1), // All but the last message
      systemInstruction: SYSTEM_PROMPT + productContext,
    })

    const result = await chat.sendMessage(customerMessage)
    const response = result.response.text()

    return response
  } catch (error) {
    console.error('Error generating AI response:', error)
    // Fallback response if AI fails
    return "I'm having trouble processing your request right now. Could you please try again or contact our support team?"
  }
}

/**
 * Analyze customer sentiment and intent from a message
 * Useful for routing conversations or triggering specific actions
 * 
 * @param message - The customer message to analyze
 * @returns Object containing sentiment and intent analysis
 */
export async function analyzeMessage(message: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  intent: 'inquiry' | 'complaint' | 'purchase' | 'support' | 'other'
  confidence: number
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const analysisPrompt = `Analyze this customer message and respond with ONLY a JSON object (no markdown, no extra text):
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "inquiry" | "complaint" | "purchase" | "support" | "other",
  "confidence": 0.0 to 1.0
}

Message: "${message}"`

    const result = await model.generateContent(analysisPrompt)
    const text = result.response.text()

    // Parse the JSON response
    const analysis = JSON.parse(text)
    return analysis
  } catch (error) {
    console.error('Error analyzing message:', error)
    // Default analysis if AI fails
    return {
      sentiment: 'neutral',
      intent: 'inquiry',
      confidence: 0.5,
    }
  }
}

/**
 * Generate product recommendations based on customer preferences
 * 
 * @param customerPreferences - Description of what the customer is looking for
 * @param availableProducts - List of products to recommend from
 * @returns Array of recommended product names
 */
export async function recommendProducts(
  customerPreferences: string,
  availableProducts: Array<{ name: string; description: string; price: number }>
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const productsText = availableProducts
      .map((p) => `- ${p.name}: ${p.description} ($${p.price})`)
      .join('\n')

    const prompt = `Based on the customer's preferences, recommend the best products from this list.
Return ONLY a JSON array of product names, nothing else.

Customer preferences: "${customerPreferences}"

Available products:
${productsText}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse the JSON response
    const recommendations = JSON.parse(text)
    return Array.isArray(recommendations) ? recommendations : []
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

// ============================================================================
// IMAGE PROCESSING - Payment Receipt & QR Analysis
// ============================================================================

export interface PaymentReceiptAnalysis {
  isValid: boolean
  confidence: number
  extractedAmount: number | null
  extractedDate: string | null
  extractedReference: string | null
  bankName: string | null
  paymentMethod: 'bank_transfer' | 'qr_payment' | 'other' | null
  description: string
  warnings: string[]
}

/**
 * Analyze a payment receipt image using Gemini Vision
 * Extracts payment information from bank transfer receipts, QR payment screenshots, etc.
 *
 * @param imageData - Base64 encoded image or image URL
 * @param expectedAmount - The expected payment amount to validate against
 * @returns Analysis results with extracted payment information
 */
export async function analyzePaymentReceipt(
  imageData: string,
  expectedAmount?: number
): Promise<PaymentReceiptAnalysis> {
  try {
    // Use Gemini Vision model for image analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `Analyze this payment receipt/screenshot and extract all payment information.
This could be a bank transfer receipt, Yape/Plin payment screenshot, or any payment confirmation.

Extract the following information and respond with ONLY a JSON object (no markdown, no extra text):
{
  "isValid": boolean (true if this appears to be a legitimate payment receipt),
  "confidence": 0.0 to 1.0 (how confident you are in the analysis),
  "extractedAmount": number or null (the payment amount),
  "extractedDate": "YYYY-MM-DD HH:mm:ss" or null (transaction date/time),
  "extractedReference": string or null (transaction reference/operation number),
  "bankName": string or null (name of bank or payment service),
  "paymentMethod": "bank_transfer" | "qr_payment" | "other" | null,
  "description": string (brief description of what you see),
  "warnings": string[] (any red flags or concerns, empty array if none)
}

${expectedAmount ? `Expected amount: ${expectedAmount} (check if the receipt matches this amount)` : ''}

Be thorough and look for:
- Payment amounts (in any currency)
- Date and time of transaction
- Reference numbers, operation codes
- Bank or payment service name (BCP, Interbank, BBVA, Yape, Plin, etc.)
- Sender/receiver information
- Any signs of image manipulation or fraud`

    // Determine if imageData is a URL or base64
    let imagePart
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // Fetch image from URL and convert to base64
      const response = await fetch(imageData)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = response.headers.get('content-type') || 'image/jpeg'

      imagePart = {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      }
    } else {
      // Assume it's already base64
      // Remove data URI prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')

      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      }
    }

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()

    // Remove markdown code blocks if present
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    const analysis: PaymentReceiptAnalysis = JSON.parse(cleanedText)

    // Additional validation: check if extracted amount matches expected amount
    if (expectedAmount && analysis.extractedAmount) {
      const difference = Math.abs(analysis.extractedAmount - expectedAmount)
      const tolerance = expectedAmount * 0.01 // 1% tolerance

      if (difference > tolerance) {
        analysis.warnings.push(
          `Amount mismatch: Expected ${expectedAmount}, found ${analysis.extractedAmount}`
        )
        analysis.confidence = Math.max(0.3, analysis.confidence - 0.3)
      }
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing payment receipt:', error)

    // Return default analysis on error
    return {
      isValid: false,
      confidence: 0,
      extractedAmount: null,
      extractedDate: null,
      extractedReference: null,
      bankName: null,
      paymentMethod: null,
      description: 'Error analyzing image',
      warnings: ['Failed to process image'],
    }
  }
}

/**
 * Detect and decode QR codes in payment images
 * Useful for validating Yape/Plin QR payments
 *
 * @param imageData - Base64 encoded image or image URL
 * @returns QR code content and analysis
 */
export async function analyzePaymentQR(imageData: string): Promise<{
  hasQRCode: boolean
  qrContent: string | null
  paymentInfo: {
    recipientPhone: string | null
    recipientName: string | null
    amount: number | null
  } | null
  confidence: number
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `Analyze this image and look for QR codes related to payment (Yape, Plin, or other digital wallet QR).

Extract the following and respond with ONLY a JSON object:
{
  "hasQRCode": boolean,
  "qrContent": string or null (any visible text/data in or near the QR),
  "paymentInfo": {
    "recipientPhone": string or null,
    "recipientName": string or null,
    "amount": number or null
  } or null,
  "confidence": 0.0 to 1.0
}

Look for:
- QR codes in the image
- Phone numbers near the QR
- Payment app logos (Yape, Plin)
- Amount information
- Recipient name`

    let imagePart
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      const response = await fetch(imageData)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = response.headers.get('content-type') || 'image/jpeg'

      imagePart = {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      }
    } else {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      }
    }

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('Error analyzing QR code:', error)
    return {
      hasQRCode: false,
      qrContent: null,
      paymentInfo: null,
      confidence: 0,
    }
  }
}
