# WhatsApp Sales Agent - Complete File Structure

## 📁 Project Organization

```
whatsapp-sales-agent/
├── 📄 Documentation Files
│   ├── README.md                    # Project overview and features
│   ├── SETUP_GUIDE.md              # Detailed step-by-step setup
│   ├── QUICK_START.md              # 5-minute quick start guide
│   ├── API_DOCUMENTATION.md        # Complete API reference
│   ├── PROJECT_SUMMARY.md          # Project summary and architecture
│   └── FILE_STRUCTURE.md           # This file
│
├── 📋 Configuration Files
│   ├── .env.example                # Environment variables template
│   ├── .gitignore                  # Git ignore rules
│   ├── package.json                # NPM dependencies
│   ├── package-lock.json           # Dependency lock file
│   ├── tsconfig.json               # TypeScript configuration
│   ├── next.config.ts              # Next.js configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── postcss.config.mjs          # PostCSS configuration
│   ├── components.json             # shadcn/ui configuration
│   └── eslint.config.mjs           # ESLint configuration
│
├── 🗄️ Database
│   └── supabase-schema.sql         # PostgreSQL schema and sample data
│
├── 📱 Frontend (Next.js App Router)
│   └── app/
│       ├── layout.tsx              # Root layout with metadata
│       ├── page.tsx                # Home page (redirects to dashboard)
│       ├── globals.css             # Global styles
│       │
│       ├── api/                    # API Routes (Backend)
│       │   ├── whatsapp/
│       │   │   └── webhook/
│       │   │       └── route.ts    # WhatsApp webhook handler
│       │   │                       # - Receives messages
│       │   │                       # - Processes with AI
│       │   │                       # - Stores in database
│       │   │                       # - Sends responses
│       │   │
│       │   └── messages/
│       │       └── send/
│       │           └── route.ts    # Send message endpoint
│       │                           # - Manual message sending
│       │                           # - Dashboard integration
│       │
│       └── dashboard/              # Dashboard Pages
│           ├── layout.tsx          # Dashboard layout with sidebar
│           ├── page.tsx            # Dashboard main page
│           │                       # - Statistics cards
│           │                       # - Feature overview
│           │                       # - Setup instructions
│           │
│           └── conversation/
│               └── [id]/
│                   └── page.tsx    # Conversation detail page
│                                   # - Full message history
│                                   # - Real-time updates
│                                   # - Send messages
│
├── 🎨 Components
│   ├── ui/                         # shadcn/ui Components (Pre-installed)
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── sidebar.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ... (40+ more UI components)
│   │
│   └── dashboard/                  # Custom Dashboard Components
│       ├── ConversationsList.tsx   # Conversations list view
│       │                           # - Real-time updates
│       │                           # - Message previews
│       │                           # - Click to view
│       │
│       ├── CustomersList.tsx       # Customers list view
│       │                           # - Filter by status
│       │                           # - Conversation count
│       │                           # - Customer details
│       │
│       └── ProductsList.tsx        # Products management
│                                   # - Add products
│                                   # - View catalog
│                                   # - Price management
│
├── 🔧 Libraries & Utilities
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts          # Supabase client configuration
│   │   │                          # - Server client (service role)
│   │   │                          # - Client client (anon key)
│   │   │                          # - Type definitions
│   │   │                          # - Database interfaces
│   │   │
│   │   ├── gemini/
│   │   │   └── client.ts          # Gemini 3 AI integration
│   │   │                          # - Response generation
│   │   │                          # - Message analysis
│   │   │                          # - Product recommendations
│   │   │                          # - Sentiment detection
│   │   │
│   │   ├── whatsapp/
│   │   │   └── client.ts          # WhatsApp Business API
│   │   │                          # - Send messages
│   │   │                          # - Parse webhooks
│   │   │                          # - Verify tokens
│   │   │                          # - Mark as read
│   │   │
│   │   └── utils.ts               # Utility functions
│   │
│   └── hooks/
│       └── use-mobile.ts          # Mobile detection hook
│
├── 📦 Public Assets
│   └── public/
│       ├── file.svg
│       ├── globe.svg
│       ├── next.svg
│       ├── vercel.svg
│       └── window.svg
│
└── 📄 Root Files
    ├── README.md
    ├── server.log                 # Development server logs
    └── bun.lock                   # Bun package manager lock
```

## 📄 File Descriptions

### Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **README.md** | Project overview, features, architecture | Everyone |
| **SETUP_GUIDE.md** | Step-by-step setup instructions | New users |
| **QUICK_START.md** | 5-minute quick start | Impatient users |
| **API_DOCUMENTATION.md** | Complete API reference | Developers |
| **PROJECT_SUMMARY.md** | Project summary and architecture | Technical leads |
| **FILE_STRUCTURE.md** | This file - file organization | Developers |

### Configuration Files

| File | Purpose |
|------|---------|
| **.env.example** | Environment variables template |
| **package.json** | NPM dependencies and scripts |
| **tsconfig.json** | TypeScript compiler options |
| **next.config.ts** | Next.js configuration |
| **tailwind.config.ts** | Tailwind CSS customization |
| **components.json** | shadcn/ui configuration |

### Core Application Files

#### API Routes (Backend)

| File | Endpoint | Purpose |
|------|----------|---------|
| **app/api/whatsapp/webhook/route.ts** | GET/POST `/api/whatsapp/webhook` | Receive WhatsApp messages, process with AI, send responses |
| **app/api/messages/send/route.ts** | POST `/api/messages/send` | Send manual messages from dashboard |

#### Pages (Frontend)

| File | Route | Purpose |
|------|-------|---------|
| **app/page.tsx** | `/` | Home page (redirects to dashboard) |
| **app/dashboard/page.tsx** | `/dashboard` | Main dashboard with stats and overview |
| **app/dashboard/conversation/[id]/page.tsx** | `/dashboard/conversation/:id` | Conversation detail view |

#### Layouts

| File | Purpose |
|------|---------|
| **app/layout.tsx** | Root layout with metadata |
| **app/dashboard/layout.tsx** | Dashboard layout with sidebar navigation |

### Library Files

#### Supabase Integration
- **lib/supabase/client.ts** - Database client and type definitions

#### AI Integration
- **lib/gemini/client.ts** - Gemini 3 API integration

#### WhatsApp Integration
- **lib/whatsapp/client.ts** - WhatsApp Business API integration

### Component Files

#### Dashboard Components
- **components/dashboard/ConversationsList.tsx** - Conversations list
- **components/dashboard/CustomersList.tsx** - Customers list
- **components/dashboard/ProductsList.tsx** - Products management

#### UI Components (shadcn/ui)
- 40+ pre-built, accessible UI components
- Located in **components/ui/**

## 🔄 Data Flow Through Files

### Message Reception Flow
```
WhatsApp Business API
        ↓
app/api/whatsapp/webhook/route.ts (POST handler)
        ↓
lib/whatsapp/client.ts (parseWhatsAppWebhook)
        ↓
lib/supabase/client.ts (store message)
        ↓
lib/gemini/client.ts (analyze & generate response)
        ↓
lib/whatsapp/client.ts (sendWhatsAppMessage)
        ↓
lib/supabase/client.ts (store response)
        ↓
components/dashboard/* (real-time update)
```

### Dashboard Display Flow
```
app/dashboard/page.tsx (main page)
        ↓
components/dashboard/ConversationsList.tsx
components/dashboard/CustomersList.tsx
components/dashboard/ProductsList.tsx
        ↓
lib/supabase/client.ts (fetch data)
        ↓
Real-time subscriptions (listen for changes)
        ↓
Update UI in real-time
```

## 📊 File Statistics

- **Total Files**: ~100+
- **TypeScript/TSX Files**: 15+
- **UI Components**: 40+
- **Documentation Files**: 6
- **Configuration Files**: 10+
- **Lines of Code**: ~3000+

## 🔑 Key Files to Understand

### Must Read First
1. **README.md** - Understand what this project does
2. **SETUP_GUIDE.md** - Follow setup instructions
3. **app/api/whatsapp/webhook/route.ts** - Main webhook logic

### Important Implementation Files
1. **lib/gemini/client.ts** - AI response generation
2. **lib/whatsapp/client.ts** - WhatsApp API integration
3. **lib/supabase/client.ts** - Database operations
4. **app/dashboard/page.tsx** - Dashboard UI

### Configuration Files
1. **.env.example** - Environment variables
2. **supabase-schema.sql** - Database schema
3. **package.json** - Dependencies

## 🚀 Development Workflow

### File Modification Order
1. **Configure** - Update `.env.local`
2. **Database** - Run `supabase-schema.sql`
3. **Test** - Start dev server with `npm run dev`
4. **Develop** - Modify files in `app/` and `lib/`
5. **Deploy** - Push to GitHub/Vercel

### Common File Edits
- **Add new API endpoint** → Create file in `app/api/`
- **Add new page** → Create file in `app/dashboard/`
- **Add new component** → Create file in `components/dashboard/`
- **Modify AI behavior** → Edit `lib/gemini/client.ts`
- **Change database schema** → Edit `supabase-schema.sql`

## 📦 Dependencies

### Core Dependencies
- **next** - React framework
- **react** - UI library
- **typescript** - Type safety
- **tailwindcss** - Styling
- **@supabase/supabase-js** - Database client
- **@google/generative-ai** - Gemini API
- **axios** - HTTP client
- **sonner** - Toast notifications

### Dev Dependencies
- **@types/node** - Node.js types
- **@types/react** - React types
- **eslint** - Code linting
- **postcss** - CSS processing

## 🔐 Security Considerations

### Files with Sensitive Data
- **.env.local** - Never commit (in .gitignore)
- **supabase-schema.sql** - Contains RLS policies

### Files with API Keys
- **lib/supabase/client.ts** - Uses environment variables
- **lib/gemini/client.ts** - Uses environment variables
- **lib/whatsapp/client.ts** - Uses environment variables

## 📈 Scalability Notes

### Files That Scale Well
- **app/api/** - Serverless, scales automatically
- **lib/supabase/** - Database handles scaling
- **components/dashboard/** - React components are efficient

### Files to Monitor
- **supabase-schema.sql** - Add indexes for large datasets
- **lib/gemini/client.ts** - Monitor API usage
- **lib/whatsapp/client.ts** - Monitor message volume

## 🧪 Testing Files

### Files to Test
1. **app/api/whatsapp/webhook/route.ts** - Test webhook
2. **lib/gemini/client.ts** - Test AI responses
3. **lib/whatsapp/client.ts** - Test message sending
4. **components/dashboard/** - Test UI components

### Testing Approach
- Manual testing with real WhatsApp messages
- API testing with curl/Postman
- UI testing in browser
- Database testing in Supabase console

## 📚 Learning Path

### Beginner
1. Read **README.md**
2. Follow **SETUP_GUIDE.md**
3. Understand **app/dashboard/page.tsx**

### Intermediate
1. Study **app/api/whatsapp/webhook/route.ts**
2. Review **lib/supabase/client.ts**
3. Explore **components/dashboard/**

### Advanced
1. Modify **lib/gemini/client.ts**
2. Extend **lib/whatsapp/client.ts**
3. Add new features to **app/api/**

---

**Last Updated:** January 2026
**Total Files:** 100+
**Total Lines of Code:** 3000+
