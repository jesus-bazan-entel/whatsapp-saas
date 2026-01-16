/**
 * Dashboard Main Page
 * 
 * Displays overview of conversations, customers, and sales metrics
 * Provides navigation to manage prospects, customers, and conversations
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle, Users, TrendingUp, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ConversationsList from '@/components/dashboard/ConversationsList'
import CustomersList from '@/components/dashboard/CustomersList'
import ProductsList from '@/components/dashboard/ProductsList'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats] = useState({
    totalCustomers: 0,
    totalProspects: 0,
    activeConversations: 0,
    totalProducts: 0,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your WhatsApp sales conversations and customer relationships
        </p>
      </div>

      {/* Setup Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Setup Required:</strong> Please configure your Supabase credentials in <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> to enable the dashboard. See <strong>SETUP_GUIDE.md</strong> for detailed instructions.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Converted customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProspects}</div>
            <p className="text-xs text-muted-foreground">Active leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">Ongoing chats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Integration
                </CardTitle>
                <CardDescription>Automatic message handling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Receive messages via WhatsApp Business API</p>
                <p>✓ AI-powered automatic responses</p>
                <p>✓ Real-time message synchronization</p>
                <p>✓ Webhook-based architecture</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Management
                </CardTitle>
                <CardDescription>Track prospects and customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Automatic customer profile creation</p>
                <p>✓ Status tracking (prospect/customer)</p>
                <p>✓ Conversation history</p>
                <p>✓ Real-time updates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Powered Sales
                </CardTitle>
                <CardDescription>Gemini 3 integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Natural language responses</p>
                <p>✓ Product recommendations</p>
                <p>✓ Sentiment analysis</p>
                <p>✓ Intent detection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Catalog
                </CardTitle>
                <CardDescription>Manage your products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Add and manage products</p>
                <p>✓ AI recommendations</p>
                <p>✓ Price management</p>
                <p>✓ Product descriptions</p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Section */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                🚀 Getting Started
              </CardTitle>
              <CardDescription className="text-green-800">
                Follow these steps to set up your WhatsApp Sales Agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">1. Set Up Supabase</h4>
                  <p className="text-sm text-green-800">
                    Create a Supabase project and get your credentials (URL, Anon Key, Service Role Key)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">2. Configure WhatsApp Business API</h4>
                  <p className="text-sm text-green-800">
                    Get your WhatsApp credentials from Meta Developers (Phone Number ID, Access Token, Verify Token)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">3. Get Gemini API Key</h4>
                  <p className="text-sm text-green-800">
                    Create a Gemini API key from Google AI Studio for AI-powered responses
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">4. Configure Environment Variables</h4>
                  <p className="text-sm text-green-800">
                    Copy <code className="bg-green-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-green-100 px-2 py-1 rounded">.env.local</code> and fill in your credentials
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">5. Set Up Database Schema</h4>
                  <p className="text-sm text-green-800">
                    Run the SQL from <code className="bg-green-100 px-2 py-1 rounded">supabase-schema.sql</code> in your Supabase SQL Editor
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">6. Configure Webhook</h4>
                  <p className="text-sm text-green-800">
                    Set up your webhook URL in Meta Dashboard pointing to <code className="bg-green-100 px-2 py-1 rounded">/api/whatsapp/webhook</code>
                  </p>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                📖 Read Complete Setup Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <ConversationsList />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomersList />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
