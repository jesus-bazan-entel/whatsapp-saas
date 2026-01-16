# WhatsApp Sales Agent - API Documentation

Complete API reference for the WhatsApp Sales Agent system.

## 🔗 Base URL

**Development:** `http://localhost:3000`
**Production:** `https://your-domain.com`

## 📨 WhatsApp Webhook Endpoint

### Webhook Verification (GET)

WhatsApp sends a verification request when you first set up the webhook.

**Endpoint:** `GET /api/whatsapp/webhook`

**Query Parameters:**
```
hub.mode=subscribe
hub.verify_token=YOUR_VERIFY_TOKEN
hub.challenge=CHALLENGE_STRING
```

**Response:**
- **Success (200):** Returns the challenge string
- **Failure (403):** Invalid token

**Example:**
```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=abc123"
```

### Receive Messages (POST)

WhatsApp sends incoming messages and events to this endpoint.

**Endpoint:** `POST /api/whatsapp/webhook`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "id": "wamid.xxx",
                "type": "text",
                "text": {
                  "body": "Hello, I'm interested in your products"
                },
                "timestamp": "1234567890"
              }
            ],
            "contacts": [
              {
                "wa_id": "1234567890",
                "profile": {
                  "name": "John Doe"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response:**
- **Success (200):** `OK`
- **Error (200):** Still returns 200 to acknowledge webhook

**Processing Flow:**
1. Parse incoming message
2. Create/update customer in Supabase
3. Create/update conversation
4. Store message in database
5. Analyze with Gemini AI
6. Generate response
7. Send response via WhatsApp
8. Update dashboard in real-time

**Message Types Supported:**
- `text` - Text messages
- `image` - Image with optional caption
- `document` - Document with optional caption
- `audio` - Audio messages
- `video` - Video with optional caption
- `location` - Location coordinates

## 💬 Send Message Endpoint

### Send Message to Customer

Manually send a message to a customer via WhatsApp.

**Endpoint:** `POST /api/messages/send`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "conversationId": "uuid-of-conversation",
  "messageText": "Thank you for your interest! Here's more info...",
  "phoneNumber": "1234567890"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "messageId": "wamid.xxx"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Failed to send message"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "messageText": "Hello! How can I help you?",
    "phoneNumber": "1234567890"
  }'
```

## 🤖 Gemini AI Integration

The system uses Gemini 3 API for:

### Response Generation
- Analyzes customer messages
- Generates natural language responses
- Considers conversation history
- Recommends relevant products

### Message Analysis
- **Sentiment Detection:** positive, neutral, negative
- **Intent Recognition:** inquiry, complaint, purchase, support, other
- **Confidence Scoring:** 0.0 to 1.0

### Product Recommendations
- Analyzes customer preferences
- Recommends matching products
- Provides personalized suggestions

## 🗄️ Supabase Database API

### Customers Table

**Schema:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT ('prospect' | 'customer' | 'inactive'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Example Query:**
```javascript
const { data } = await supabaseClient
  .from('customers')
  .select('*')
  .eq('phone_number', '1234567890')
  .single()
```

### Conversations Table

**Schema:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  title TEXT,
  status TEXT ('active' | 'closed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Example Query:**
```javascript
const { data } = await supabaseClient
  .from('conversations')
  .select('*')
  .eq('customer_id', customerId)
  .eq('status', 'active')
```

### Messages Table

**Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_type TEXT ('customer' | 'agent'),
  content TEXT NOT NULL,
  message_type TEXT ('text' | 'image' | 'document' | 'audio' | 'video' | 'location'),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP
)
```

**Example Query:**
```javascript
const { data } = await supabaseClient
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
```

### Products Table

**Schema:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Example Query:**
```javascript
const { data } = await supabaseClient
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
```

## 🔄 Real-time Subscriptions

### Subscribe to Messages

Listen for new messages in a conversation in real-time.

```javascript
const subscription = supabaseClient
  .channel(`conversation-${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()

// Cleanup
supabaseClient.removeChannel(subscription)
```

### Subscribe to Conversations

Listen for new conversations.

```javascript
const subscription = supabaseClient
  .channel('conversations-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'conversations' },
    (payload) => {
      console.log('Conversation changed:', payload)
    }
  )
  .subscribe()
```

## 🔐 Authentication

### WhatsApp Webhook Verification

The webhook uses token-based verification:

```typescript
// In .env.local
WHATSAPP_VERIFY_TOKEN=your_secure_token

// Verification happens automatically in the webhook handler
if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
  // Token is valid
}
```

### Supabase Authentication

The system uses Supabase's Row Level Security (RLS):

```sql
-- Example RLS policy
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = customer_id)
```

## 📊 Data Flow Examples

### Example 1: Customer Sends Message

```
1. Customer sends WhatsApp message
   ↓
2. WhatsApp sends POST to /api/whatsapp/webhook
   ↓
3. System parses message:
   {
     messageId: "wamid.xxx",
     fromPhoneNumber: "1234567890",
     messageText: "Do you have iPhone cases?",
     timestamp: 1234567890,
     type: "text"
   }
   ↓
4. Create/update customer:
   {
     phone_number: "1234567890",
     name: "Customer 1234567890",
     status: "prospect"
   }
   ↓
5. Create/update conversation:
   {
     customer_id: "uuid",
     title: "Chat with Customer",
     status: "active"
   }
   ↓
6. Store incoming message:
   {
     conversation_id: "uuid",
     sender_type: "customer",
     content: "Do you have iPhone cases?",
     message_type: "text"
   }
   ↓
7. Analyze with Gemini:
   {
     sentiment: "neutral",
     intent: "inquiry",
     confidence: 0.95
   }
   ↓
8. Generate AI response:
   "Yes! We have premium iPhone cases. Would you like to know more?"
   ↓
9. Store AI response:
   {
     conversation_id: "uuid",
     sender_type: "agent",
     content: "Yes! We have premium iPhone cases...",
     message_type: "text"
   }
   ↓
10. Send via WhatsApp API
    ↓
11. Dashboard updates in real-time
```

### Example 2: Send Message from Dashboard

```
1. User clicks "Send Message" in dashboard
   ↓
2. POST to /api/messages/send:
   {
     conversationId: "uuid",
     messageText: "Follow-up message",
     phoneNumber: "1234567890"
   }
   ↓
3. Send via WhatsApp API
   ↓
4. Store in database:
   {
     conversation_id: "uuid",
     sender_type: "agent",
     content: "Follow-up message",
     message_type: "text"
   }
   ↓
5. Dashboard updates in real-time
```

## 🚨 Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "error": "Missing required fields: messageText, phoneNumber"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid webhook token"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to send message"
}
```

### Error Recovery

The system automatically:
- Retries failed API calls
- Logs errors for debugging
- Returns 200 for webhook to prevent retries
- Gracefully handles missing data

## 📈 Rate Limits

**WhatsApp API:**
- 1000 messages per second per business account
- Check Meta Dashboard for current limits

**Gemini API:**
- Check Google Cloud Console for quota
- Default: 60 requests per minute

**Supabase:**
- Depends on your plan
- Check Supabase dashboard for usage

## 🔍 Debugging

### Enable Logging

```javascript
// In development, logs are printed to console
console.log('📨 Received message:', messageText)
console.log('🤖 AI Response:', aiResponse)
console.log('✅ Message sent to', phoneNumber)
```

### Check Server Logs

```bash
# Terminal output from npm run dev
npm run dev
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Filter by table or time range

### Test Webhook

```bash
# Test webhook verification
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123"

# Test message sending
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-id",
    "messageText": "Test message",
    "phoneNumber": "1234567890"
  }'
```

## 📚 Additional Resources

- [WhatsApp Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Gemini API Reference](https://ai.google.dev/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Last Updated:** January 2026
