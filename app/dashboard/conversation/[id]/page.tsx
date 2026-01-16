/**
 * Conversation Detail Page
 *
 * Shows full conversation history with a customer
 * Allows sending new messages and viewing customer details
 * Real-time message updates using Supabase subscriptions
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  sender_type: 'customer' | 'agent'
  created_at: string
  message_type: string
}

interface Customer {
  id: string
  name: string
  phone_number: string
  email?: string
  status: string
}

/**
 * NOTE:
 * Supabase nested selects sometimes return arrays depending on relationship discovery.
 * To avoid build-time type issues, we normalize `customer` to a single object.
 */
interface Conversation {
  id: string
  title: string
  status: string
  customer: Customer
  messages: Message[]
}

type ConversationRaw = Omit<Conversation, 'customer'> & {
  customer: Customer | Customer[]
}

function normalizeCustomer(customer: Customer | Customer[] | null | undefined): Customer {
  if (!customer) {
    return {
      id: 'unknown',
      name: 'Unknown',
      phone_number: '',
      status: 'prospect',
    }
  }
  return Array.isArray(customer) ? customer[0] : customer
}

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  // Memoize subscription channel name
  const channelName = useMemo(() => `conversation-${conversationId}`, [conversationId])

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('conversations')
          .select(
            `
            id,
            title,
            status,
            customer:customers(id, name, phone_number, email, status),
            messages(id, content, sender_type, created_at, message_type)
          `
          )
          .eq('id', conversationId)
          .single()

        if (error) throw error

        const raw = data as unknown as ConversationRaw
        const normalized: Conversation = {
          id: raw.id,
          title: raw.title,
          status: raw.status,
          customer: normalizeCustomer(raw.customer),
          messages: raw.messages || [],
        }

        setConversation(normalized)
        setMessages(normalized.messages)
      } catch (error) {
        console.error('Error fetching conversation:', error)
        toast.error('Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()

    const subscription = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(subscription)
    }
  }, [conversationId, channelName])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !conversation) {
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          messageText: messageText.trim(),
          phoneNumber: conversation.customer.phone_number,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setMessageText('')
      toast.success('Message sent')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading conversation...</div>
  }

  if (!conversation) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Conversation not found</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{conversation.customer.name}</h1>
            <Badge variant={conversation.customer.status === 'customer' ? 'default' : 'secondary'}>
              {conversation.customer.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{conversation.customer.phone_number}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{conversation.customer.phone_number}</p>
          </div>
          {conversation.customer.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{conversation.customer.email}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={conversation.customer.status === 'customer' ? 'default' : 'secondary'}>
              {conversation.customer.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
          <CardDescription>{messages.length} messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_type === 'customer'
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
