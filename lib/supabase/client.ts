/**
 * Supabase Client Configuration
 * 
 * This module provides both server-side and client-side Supabase clients
 * for database operations and real-time subscriptions.
 * 
 * Server client: Used in API routes and server components
 * Client: Used in browser components for real-time updates
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Server-side Supabase client
 * Uses service role key for full database access
 * Used in API routes and server-side operations
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Client-side Supabase client
 * Uses anon key for browser operations
 * Respects Row Level Security (RLS) policies
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

/**
 * Type definitions for database tables
 * These types are used throughout the application for type safety
 */
export interface Customer {
  id: string
  phone_number: string
  name: string
  email?: string
  status: 'prospect' | 'customer' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  customer_id: string
  title?: string
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent'
  content: string
  product_id?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  created_at: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
  customer: Customer
}
