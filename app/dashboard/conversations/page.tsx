/**
 * Conversations Page
 * Dedicated page for managing conversations
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ConversationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground mt-2">
          Manage all your WhatsApp conversations with customers
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure Supabase credentials in <code className="bg-muted px-2 py-1 rounded">.env.local</code> to see conversations
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Active Conversations</CardTitle>
          <CardDescription>Your WhatsApp conversations will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Once you configure Supabase and set up WhatsApp, conversations will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
