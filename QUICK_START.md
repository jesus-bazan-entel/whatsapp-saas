# WhatsApp Sales Agent - Quick Start Guide

## 🎯 What You've Built

A complete WhatsApp Business API integration with:
- ✅ AI-powered sales agent (Gemini 3)
- ✅ Real-time dashboard
- ✅ Supabase database
- ✅ Automatic customer management
- ✅ Product catalog
- ✅ Full conversation history

## 📦 What's Included

### Backend Components
- **WhatsApp Webhook Handler** (`/api/whatsapp/webhook`)
  - Receives messages from WhatsApp Business API
  - Processes and stores conversations
  - Generates AI responses
  - Sends messages back to customers

- **Message Sending API** (`/api/messages/send`)
  - Allows manual message sending from dashboard
  - Stores messages in database

### Frontend Components
- **Dashboard** (`/dashboard`)
  - Real-time statistics
  - Conversations management
  - Customer tracking
  - Product catalog

- **Conversation View** (`/dashboard/conversation/[id]`)
  - Full message history
  - Real-time message updates
  - Send follow-up messages

### AI Integration
- **Gemini 3 AI** (`/lib/gemini/client.ts`)
  - Natural language responses
  - Product recommendations
  - Sentiment analysis
  - Intent detection

### Database
- **Supabase PostgreSQL** (`supabase-schema.sql`)
  - Customers table
  - Conversations table
  - Messages table
  - Products table
  - Real-time subscriptions

## 🚀 5-Minute Setup

### Step 1: Get Your Credentials

**Supabase:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy: Project URL, Anon Key, Service Role Key

**WhatsApp:**
1. Go to [Meta Developers](https://developers.facebook.com)
2. Create Business app
3. Add WhatsApp product
4. Copy: Phone Number ID, Access Token, Verify Token

**Gemini:**
1. Go to [Google AI Studio](https://ai.google.dev)
2. Create API key
3. Copy the key

### Step 2: Configure Environment

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your credentials
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_VERIFY_TOKEN=your_token
GEMINI_API_KEY=your_key
```

### Step 3: Set Up Database

1. In Supabase, go to SQL Editor
2. Create new query
3. Copy entire content from `supabase-schema.sql`
4. Paste and run

### Step 4: Configure Webhook

**For Local Testing:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3000
```

**In Meta Dashboard:**
1. Go to WhatsApp → Configuration
2. Set Webhook URL: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
3. Set Verify Token: Your `WHATSAPP_VERIFY_TOKEN`
4. Subscribe to "messages"

### Step 5: Test

1. Send message to your WhatsApp Business number
2. Check dashboard at `http://localhost:3000/dashboard`
3. AI should respond automatically

## 📊 How It Works

```
Customer sends WhatsApp message
           ↓
Webhook receives at /api/whatsapp/webhook
           ↓
System creates/updates customer
           ↓
Stores message in Supabase
           ↓
Gemini AI analyzes and generates response
           ↓
Sends response back via WhatsApp
           ↓
Dashboard updates in real-time
```

## 🎮 Dashboard Features

### Conversations Tab
- View all active chats
- See message previews
- Click to view full conversation
- Send follow-up messages

### Customers Tab
- Track prospects and customers
- See conversation count
- Filter by status
- View customer details

### Products Tab
- Add products to catalog
- Used for AI recommendations
- Manage pricing and descriptions

## 🔧 API Endpoints

### Webhook
```
GET  /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
POST /api/whatsapp/webhook
```

### Messages
```
POST /api/messages/send
Body: {
  conversationId: string,
  messageText: string,
  phoneNumber: string
}
```

## 📁 Project Structure

```
whatsapp-sales-agent/
├── app/
│   ├── api/whatsapp/webhook/route.ts    # Webhook handler
│   ├── api/messages/send/route.ts       # Send message
│   ├── dashboard/page.tsx               # Main dashboard
│   └── dashboard/conversation/[id]/     # Conversation view
├── lib/
│   ├── supabase/client.ts              # Database client
│   ├── gemini/client.ts                # AI integration
│   └── whatsapp/client.ts              # WhatsApp API
├── components/dashboard/                # Dashboard components
├── .env.example                         # Environment template
├── supabase-schema.sql                 # Database schema
├── SETUP_GUIDE.md                      # Detailed setup
└── README.md                           # Full documentation
```

## 🔐 Security Checklist

- [ ] Never commit `.env.local` (already in .gitignore)
- [ ] Use permanent access tokens (not temporary)
- [ ] Enable HTTPS in production
- [ ] Set up Supabase RLS policies
- [ ] Validate all webhook inputs
- [ ] Monitor API usage and costs

## 🚀 Production Deployment

### Vercel
```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on push
```

### Update Webhook URL
In Meta Dashboard, change webhook URL to:
```
https://your-app.vercel.app/api/whatsapp/webhook
```

## 🐛 Troubleshooting

### Webhook not receiving messages
- Check ngrok URL is correct
- Verify webhook token matches
- Ensure WhatsApp number is verified
- Check server logs: `npm run dev`

### AI not responding
- Verify Gemini API key is valid
- Check API quota in Google Cloud
- Review server logs for errors

### Dashboard not loading
- Check Supabase credentials in `.env.local`
- Verify database schema is created
- Clear browser cache
- Check browser console for errors

## 📚 Key Files

| File | Purpose |
|------|---------|
| `app/api/whatsapp/webhook/route.ts` | Receives WhatsApp messages |
| `lib/gemini/client.ts` | AI response generation |
| `lib/whatsapp/client.ts` | WhatsApp API integration |
| `lib/supabase/client.ts` | Database client |
| `app/dashboard/page.tsx` | Main dashboard |
| `supabase-schema.sql` | Database tables |
| `.env.example` | Environment variables |

## 💡 Tips

1. **Test locally first** with ngrok before deploying
2. **Monitor API usage** to avoid unexpected costs
3. **Review conversations** to improve AI responses
4. **Update products regularly** for better recommendations
5. **Set up error alerts** for production issues
6. **Backup database** regularly

## 🎓 Learning Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review server logs: `npm run dev` output
3. Check Supabase dashboard for database issues
4. Verify all credentials are correct
5. Test webhook with curl or Postman

## 🎉 You're Ready!

Your WhatsApp Sales Agent is ready to:
- ✅ Receive customer messages
- ✅ Generate AI responses
- ✅ Track customers and conversations
- ✅ Manage products
- ✅ Monitor sales in real-time

Start by configuring your credentials and setting up the webhook!

---

**Happy selling! 🚀**
