# 🚀 WhatsApp Sales Agent - START HERE

Welcome! This is your complete WhatsApp Business API integration with AI-powered sales automation.

## ⚡ Quick Navigation

### 📖 Documentation (Read in This Order)
1. **[README.md](./README.md)** - Project overview and features (5 min read)
2. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide (5 min read)
3. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions (15 min read)
4. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API reference (10 min read)
5. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Architecture overview (10 min read)
6. **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** - Code organization (5 min read)

### 🎯 What You Need to Do

#### Step 1: Get Your Credentials (10 minutes)
- [ ] Create Supabase project → Get URL, Anon Key, Service Role Key
- [ ] Create WhatsApp Business Account → Get Phone Number ID, Access Token, Verify Token
- [ ] Create Gemini API Key → Get API key from Google AI Studio

#### Step 2: Configure Environment (5 minutes)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all credentials from Step 1

#### Step 3: Set Up Database (5 minutes)
- [ ] Open Supabase SQL Editor
- [ ] Copy entire content from `supabase-schema.sql`
- [ ] Paste and run in SQL Editor

#### Step 4: Start Development (2 minutes)
- [ ] Run `npm install` (if not already done)
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000/dashboard`

#### Step 5: Configure Webhook (10 minutes)
- [ ] Run `ngrok http 3000` in another terminal
- [ ] Copy ngrok URL
- [ ] Go to Meta Dashboard → WhatsApp → Configuration
- [ ] Set Webhook URL: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
- [ ] Set Verify Token: Your `WHATSAPP_VERIFY_TOKEN`
- [ ] Subscribe to "messages"

#### Step 6: Test (5 minutes)
- [ ] Send message to your WhatsApp Business number
- [ ] Check dashboard at `http://localhost:3000/dashboard`
- [ ] AI should respond automatically

**Total Time: ~45 minutes**

## 🎓 Understanding the System

### What This Does
```
Customer sends WhatsApp message
        ↓
Your webhook receives it
        ↓
AI analyzes and generates response
        ↓
Response sent back to customer
        ↓
Everything saved in database
        ↓
Dashboard shows real-time updates
```

### Key Components
- **WhatsApp Webhook** - Receives messages from customers
- **Gemini AI** - Generates intelligent responses
- **Supabase Database** - Stores all conversations
- **Dashboard** - Real-time monitoring and management

## 📁 Important Files

### Must Know
- **`.env.example`** - Copy this to `.env.local` and fill in credentials
- **`supabase-schema.sql`** - Run this in Supabase to create database
- **`app/api/whatsapp/webhook/route.ts`** - Main webhook handler
- **`app/dashboard/page.tsx`** - Dashboard UI

### Configuration
- **`package.json`** - Dependencies
- **`next.config.ts`** - Next.js settings
- **`tailwind.config.ts`** - Styling settings

## 🔧 Common Tasks

### Send a Test Message
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-id",
    "messageText": "Hello!",
    "phoneNumber": "1234567890"
  }'
```

### Check Server Logs
```bash
npm run dev
# Logs appear in terminal
```

### View Database
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run queries to view data

### Restart Dev Server
```bash
# Press Ctrl+C to stop
# Run again
npm run dev
```

## 🚨 Troubleshooting

### Webhook Not Receiving Messages
- ✅ Check ngrok is running
- ✅ Verify webhook URL in Meta Dashboard
- ✅ Check webhook token matches
- ✅ Ensure WhatsApp number is verified

### AI Not Responding
- ✅ Check Gemini API key is valid
- ✅ Check API quota in Google Cloud
- ✅ Review server logs for errors

### Dashboard Not Loading
- ✅ Check Supabase credentials in `.env.local`
- ✅ Verify database schema is created
- ✅ Clear browser cache
- ✅ Check browser console for errors

### Database Issues
- ✅ Verify Supabase credentials
- ✅ Check schema is created
- ✅ Review RLS policies
- ✅ Check database logs

## 📚 Documentation Map

```
START_HERE.md (You are here)
    ↓
README.md (Overview)
    ↓
QUICK_START.md (5-minute setup)
    ↓
SETUP_GUIDE.md (Detailed setup)
    ↓
API_DOCUMENTATION.md (API reference)
    ↓
PROJECT_SUMMARY.md (Architecture)
    ↓
FILE_STRUCTURE.md (Code organization)
```

## 🎯 Success Checklist

- [ ] Credentials obtained from Supabase, WhatsApp, and Gemini
- [ ] `.env.local` configured with all credentials
- [ ] Database schema created in Supabase
- [ ] Dev server running (`npm run dev`)
- [ ] ngrok exposing local server
- [ ] Webhook configured in Meta Dashboard
- [ ] Test message sent and received
- [ ] Dashboard showing conversation
- [ ] AI response generated automatically
- [ ] Message stored in database

## 💡 Pro Tips

1. **Test Locally First** - Use ngrok before deploying
2. **Monitor API Usage** - Check costs regularly
3. **Review Conversations** - Learn from customer interactions
4. **Update Products** - Keep catalog fresh
5. **Backup Database** - Regular Supabase backups
6. **Set Error Alerts** - Monitor production issues

## 🚀 Next Steps After Setup

1. **Add Products** - Go to dashboard → Products tab
2. **Monitor Conversations** - Check dashboard regularly
3. **Improve AI** - Review conversations and adjust prompts
4. **Deploy to Production** - Push to GitHub/Vercel
5. **Scale Up** - Monitor usage and optimize

## 📞 Getting Help

### If Something Doesn't Work
1. Check the relevant documentation file
2. Review server logs: `npm run dev` output
3. Check Supabase dashboard for database issues
4. Verify all credentials are correct
5. Test webhook with curl or Postman

### Documentation by Topic
- **Setup Issues** → See SETUP_GUIDE.md
- **API Questions** → See API_DOCUMENTATION.md
- **Architecture** → See PROJECT_SUMMARY.md
- **File Organization** → See FILE_STRUCTURE.md
- **Quick Help** → See QUICK_START.md

## 🎉 You're Ready!

Your WhatsApp Sales Agent is ready to:
- ✅ Receive customer messages
- ✅ Generate AI responses
- ✅ Track customers and conversations
- ✅ Manage products
- ✅ Monitor sales in real-time

**Start with QUICK_START.md for a 5-minute setup!**

---

## 📋 File Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] WhatsApp Business Account set up
- [ ] Gemini API key obtained
- [ ] This project cloned/downloaded
- [ ] Dependencies installed (`npm install`)

## 🔗 Useful Links

- [Supabase](https://supabase.com)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Google Gemini API](https://ai.google.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [ngrok](https://ngrok.com)

## 📊 System Requirements

- **Node.js**: 18 or higher
- **npm**: 9 or higher
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Internet**: Required for API calls
- **Accounts**: Supabase, WhatsApp Business, Google Cloud

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Read documentation | 30 min |
| Get credentials | 15 min |
| Configure environment | 5 min |
| Set up database | 5 min |
| Start dev server | 2 min |
| Configure webhook | 10 min |
| Test system | 5 min |
| **Total** | **~45 min** |

## 🎓 Learning Resources

- **Beginner**: Start with README.md and QUICK_START.md
- **Intermediate**: Read SETUP_GUIDE.md and API_DOCUMENTATION.md
- **Advanced**: Study PROJECT_SUMMARY.md and FILE_STRUCTURE.md

---

**Last Updated:** January 2026
**Version:** 1.0
**Status:** Production Ready ✅

**Happy selling! 🚀**
