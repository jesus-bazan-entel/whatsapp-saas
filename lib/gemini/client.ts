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
