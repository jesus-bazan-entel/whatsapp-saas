/**
 * Safe Supabase Client
 * 
 * Versión segura que funciona sin credenciales configuradas
 * Muestra un mensaje amigable en lugar de errores
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Crear clientes con valores por defecto
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Verificar si está configurado
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  )
}

// Type definitions
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
