# WhatsApp Sales Agent - Complete Setup Guide

This is a comprehensive WhatsApp Business API integration with AI-powered sales automation, real-time dashboard, and Supabase database.

## 🚀 Features

- **WhatsApp Business API Integration**: Receive and send messages automatically
- **AI-Powered Responses**: Uses Google Gemini 3 for natural language understanding and product recommendations
- **Real-time Dashboard**: Monitor conversations, customers, and sales metrics in real-time
- **Supabase Database**: All conversations and customer data stored securely
- **Automatic Customer Management**: Automatically creates customer profiles and tracks status
- **Product Catalog**: Manage products and get AI recommendations for customers
- **Conversation History**: Full message history with real-time updates

## 📋 Prerequisites

Before starting, you'll need:

1. **WhatsApp Business Account**
   - Meta Business Account (facebook.com/business)
   - WhatsApp Business App
   - Phone number verified for WhatsApp Business

2. **Supabase Account**
   - Free account at supabase.com
   - PostgreSQL database

3. **Google Cloud Account**
   - Gemini API key from Google AI Studio (ai.google.dev)

4. **Node.js & npm**
   - Node.js 18+ installed

## 🔧 Step 1: Set Up Supabase

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create
4. Wait for database to be ready

### 1.2 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Create Database Schema
1. In Supabase, go to SQL Editor
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Wait for tables to be created

## 🔑 Step 2: Set Up WhatsApp Business API

### 2.1 Get WhatsApp Credentials
1. Go to [Meta Developers](https://developers.facebook.com)
2. Create an app (type: Business)
3. Add WhatsApp product
4. Go to WhatsApp → Getting Started
5. Copy:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - **Access Token** (temporary) → `WHATSAPP_ACCESS_TOKEN`

### 2.2 Get Permanent Access Token
1. In Meta Developers, go to Settings → User Tokens
2. Generate a new token with `whatsapp_business_messaging` permission
3. Copy this token → `WHATSAPP_ACCESS_TOKEN`

### 2.3 Set Webhook Verification Token
1. Create a random string (e.g., `your_secure_webhook_token_123`)
2. Save as → `WHATSAPP_VERIFY_TOKEN`

## 🤖 Step 3: Set Up Gemini API

### 3.1 Get Gemini API Key
1. Go to [Google AI Studio](https://ai.google.dev)
2. Click "Get API Key"
3. Create new API key
4. Copy the key → `GEMINI_API_KEY`

## 🌐 Step 4: Configure Environment Variables

### 4.1 Create .env.local
1. Copy `.env.example` to `.env.local`
2. Fill in all values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🚀 Step 5: Run the Application

### 5.1 Install Dependencies
```bash
npm install
```

### 5.2 Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000/dashboard`

## 🔗 Step 6: Configure WhatsApp Webhook

### 6.1 Expose Local Server (Development)
For local testing, use ngrok to expose your server:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# In a new terminal, expose port 3000
ngrok http 3000
```

This will give you a URL like: `https://abc123.ngrok.io`

### 6.2 Configure Webhook in Meta Dashboard
1. Go to Meta Developers → Your App → WhatsApp → Configuration
2. Under "Webhook URL", click "Edit"
3. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
   - **Verify Token**: The token you set in `WHATSAPP_VERIFY_TOKEN`
4. Click "Verify and Save"
5. Subscribe to "messages" webhook field

### 6.3 Test Webhook
1. Send a test message to your WhatsApp Business number
2. Check the server logs - you should see the message received
3. The AI should respond automatically

## 📱 Step 7: Access the Dashboard

1. Open `http://localhost:3000/dashboard`
2. You should see:
   - Dashboard with stats
   - Conversations tab
   - Customers tab
   - Products tab

## 🎯 How It Works

### Message Flow
1. Customer sends message to WhatsApp Business number
2. WhatsApp sends webhook to `/api/whatsapp/webhook`
3. System:
   - Creates/updates customer in Supabase
   - Creates/updates conversation
   - Stores incoming message
   - Analyzes message sentiment and intent
   - Generates AI response using Gemini
   - Stores AI response
   - Sends response back via WhatsApp
4. Dashboard updates in real-time

### AI Features
- **Natural Language Understanding**: Gemini analyzes customer messages
- **Product Recommendations**: AI suggests relevant products
- **Sentiment Analysis**: Detects customer sentiment (positive/negative/neutral)
- **Intent Detection**: Identifies if customer wants to buy, complain, or ask questions
- **Context Awareness**: Uses conversation history for better responses

## 📊 Dashboard Features

### Conversations Tab
- View all active conversations
- See latest message preview
- Click to view full conversation
- Send follow-up messages

### Customers Tab
- View all customers and prospects
- See conversation count per customer
- Filter by status (customer vs prospect)
- Track customer journey

### Products Tab
- Manage product catalog
- Add new products
- Products used for AI recommendations
- Displayed to customers in conversations

## 🔒 Security Notes

- **Never commit `.env.local`** - it's in `.gitignore`
- **Use permanent access tokens** for production
- **Enable Row Level Security (RLS)** in Supabase for multi-user access
- **Validate all inputs** before processing
- **Use HTTPS** in production (not ngrok)

## 🚀 Production Deployment

### Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# Vercel will auto-deploy on push
```

### Configure Production Webhook
1. Get your Vercel URL: `https://your-app.vercel.app`
2. In Meta Dashboard, update webhook URL to:
   `https://your-app.vercel.app/api/whatsapp/webhook`
3. Set environment variables in Vercel dashboard

### Database Backups
- Supabase automatically backs up your database
- Enable point-in-time recovery in Supabase settings

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- Check ngrok is running and URL is correct
- Verify webhook token matches in Meta Dashboard
- Check server logs for errors
- Ensure WhatsApp number is verified

### AI Not Responding
- Check Gemini API key is valid
- Check API quota in Google Cloud Console
- Verify Supabase connection
- Check server logs for errors

### Messages Not Saving
- Verify Supabase credentials
- Check database schema is created
- Verify RLS policies allow inserts
- Check server logs for database errors

### Dashboard Not Loading
- Clear browser cache
- Check Supabase credentials in `.env.local`
- Verify Supabase project is active
- Check browser console for errors

## 📚 API Endpoints

### Webhook
- **GET** `/api/whatsapp/webhook` - Webhook verification
- **POST** `/api/whatsapp/webhook` - Receive messages

### Messages
- **POST** `/api/messages/send` - Send message to customer

## 🔄 Real-time Updates

The dashboard uses Supabase real-time subscriptions:
- Conversations update instantly when new messages arrive
- Customer list updates when status changes
- Message count updates in real-time

## 📖 Additional Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 💡 Tips & Best Practices

1. **Test with sample messages** before going live
2. **Monitor API usage** to avoid unexpected costs
3. **Set up error alerts** for production
4. **Regularly backup** your Supabase database
5. **Update products regularly** for better recommendations
6. **Review conversations** to improve AI responses
7. **Use conversation history** for context in responses

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs: `npm run dev` output
3. Check Supabase dashboard for database issues
4. Verify all credentials are correct
5. Test webhook with curl or Postman

---

**Happy selling! 🎉**
