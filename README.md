# WhatsApp Sales Agent 🤖

A complete WhatsApp Business API integration with AI-powered sales automation, real-time dashboard, and Supabase database.

## ✨ Key Features

- **🤖 AI-Powered Responses** - Google Gemini 3 generates natural, context-aware responses
- **💬 WhatsApp Integration** - Seamless integration with WhatsApp Business API
- **📊 Real-time Dashboard** - Monitor conversations, customers, and sales metrics
- **🗄️ Supabase Database** - Secure PostgreSQL database for all data
- **👥 Customer Management** - Automatic customer profile creation and status tracking
- **📦 Product Catalog** - Manage products and get AI recommendations
- **💾 Full History** - Complete conversation history with real-time updates
- **🔄 Real-time Sync** - Dashboard updates instantly as messages arrive

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Business API                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Webhook)                    │
│  /api/whatsapp/webhook - Receive & process messages         │
│  /api/messages/send - Send messages to customers            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Gemini 3 AI  │  │   Supabase   │  │  WhatsApp    │
│ - Responses  │  │  - Database  │  │  - Send Msg  │
│ - Analysis   │  │  - Real-time │  │  - Webhooks  │
└──────────────┘  └──────────────┘  └──────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Dashboard (React)                       │
│  - Conversations view                                        │
│  - Customers management                                      │
│  - Products catalog                                          │
│  - Real-time updates                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- WhatsApp Business Account
- Google Gemini API key

### 2. Setup
```bash
# Clone and install
git clone <repo>
cd whatsapp-sales-agent
npm install

# Configure environment
cp .env.example .env.local
# Fill in your credentials

# Set up database
# Run supabase-schema.sql in Supabase SQL Editor

# Start development server
npm run dev
```

### 3. Configure Webhook
```bash
# Expose local server (development)
ngrok http 3000

# Update webhook in Meta Dashboard:
# URL: https://your-ngrok-url.ngrok.io/api/whatsapp/webhook
# Verify Token: Your WHATSAPP_VERIFY_TOKEN
```

### 4. Access Dashboard
Open `http://localhost:3000/dashboard`

## 📁 Project Structure

```
whatsapp-sales-agent/
├── app/
│   ├── api/
│   │   ├── whatsapp/
│   │   │   └── webhook/route.ts      # WhatsApp webhook handler
│   │   └── messages/
│   │       └── send/route.ts         # Send message endpoint
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard main page
│   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   └── conversation/[id]/page.tsx # Conversation detail view
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
├── components/
│   ├── ui/                           # shadcn/ui components
│   └── dashboard/
│       ├── ConversationsList.tsx     # Conversations component
│       ├── CustomersList.tsx         # Customers component
│       └── ProductsList.tsx          # Products component
├── lib/
│   ├── supabase/
│   │   └── client.ts                 # Supabase client & types
│   ├── gemini/
│   │   └── client.ts                 # Gemini AI integration
│   └── whatsapp/
│       └── client.ts                 # WhatsApp API integration
├── .env.example                      # Environment variables template
├── supabase-schema.sql               # Database schema
├── SETUP_GUIDE.md                    # Detailed setup instructions
└── README.md                         # This file
```

## 🔧 Configuration

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 📊 Database Schema

### Customers
- `id` - UUID primary key
- `phone_number` - WhatsApp phone number (unique)
- `name` - Customer name
- `email` - Optional email
- `status` - prospect | customer | inactive
- `created_at` - Timestamp

### Conversations
- `id` - UUID primary key
- `customer_id` - Foreign key to customers
- `title` - Conversation title
- `status` - active | closed
- `created_at` - Timestamp

### Messages
- `id` - UUID primary key
- `conversation_id` - Foreign key to conversations
- `sender_type` - customer | agent
- `content` - Message text
- `message_type` - text | image | document | audio | video | location
- `product_id` - Optional product reference
- `created_at` - Timestamp

### Products
- `id` - UUID primary key
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `image_url` - Optional image URL
- `created_at` - Timestamp

## 🤖 AI Features

### Message Analysis
- **Sentiment Detection** - Positive, neutral, or negative
- **Intent Recognition** - inquiry, complaint, purchase, support, other
- **Confidence Scoring** - How confident the AI is in its analysis

### Response Generation
- **Context Awareness** - Uses conversation history
- **Product Recommendations** - Suggests relevant products
- **Natural Language** - Conversational and friendly tone
- **Fallback Handling** - Graceful error handling

### Conversation Management
- **Auto Customer Creation** - Creates customer on first message
- **Status Tracking** - Updates customer status based on intent
- **History Preservation** - Full message history for context

## 🔄 Message Flow

1. **Receive** - WhatsApp sends message to webhook
2. **Parse** - Extract message content and metadata
3. **Store** - Save incoming message to database
4. **Analyze** - Gemini analyzes sentiment and intent
5. **Generate** - AI generates contextual response
6. **Save** - Store AI response in database
7. **Send** - Send response back via WhatsApp
8. **Update** - Dashboard updates in real-time

## 📱 Dashboard Features

### Conversations Tab
- List all active conversations
- See latest message preview
- Message count per conversation
- Click to view full conversation
- Send follow-up messages

### Customers Tab
- View all customers and prospects
- Filter by status
- See conversation count
- Track customer journey
- View customer details

### Products Tab
- Manage product catalog
- Add new products
- View product details
- Used for AI recommendations

## 🔐 Security

- **Environment Variables** - Sensitive data in `.env.local`
- **Row Level Security** - Supabase RLS policies
- **API Authentication** - WhatsApp token validation
- **Webhook Verification** - Token-based verification
- **HTTPS Only** - Production uses HTTPS

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on push
```

### Other Platforms
- Ensure Node.js 18+ support
- Set all environment variables
- Configure webhook URL to production domain
- Enable HTTPS

## 📈 Monitoring

### Key Metrics
- Total customers
- Prospects vs customers
- Active conversations
- Message volume
- Response time

### Logs
- Server logs: `npm run dev` output
- Supabase logs: Dashboard → Logs
- WhatsApp logs: Meta Developers dashboard

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- Verify ngrok URL is correct
- Check webhook token matches
- Ensure WhatsApp number is verified
- Check server logs

### AI Not Responding
- Verify Gemini API key
- Check API quota
- Review server logs
- Test with simple message

### Database Issues
- Verify Supabase credentials
- Check schema is created
- Review RLS policies
- Check database logs

## 📚 Resources

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API](https://ai.google.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## 💡 Tips

1. **Test Locally First** - Use ngrok for local testing
2. **Monitor API Usage** - Avoid unexpected costs
3. **Regular Backups** - Backup Supabase database
4. **Update Products** - Keep catalog fresh
5. **Review Conversations** - Improve AI responses
6. **Set Error Alerts** - Monitor production issues

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**Built with ❤️ using Next.js, Supabase, and Gemini AI**
