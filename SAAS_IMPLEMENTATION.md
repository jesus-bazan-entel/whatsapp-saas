# WhatsApp Sales Agent SaaS - Guía de Implementación

## 📋 Tabla de Contenidos

1. [Fase 1: Configuración Base](#fase-1-configuración-base)
2. [Fase 2: Autenticación Multi-Tenant](#fase-2-autenticación-multi-tenant)
3. [Fase 3: Dashboard Admin](#fase-3-dashboard-admin)
4. [Fase 4: Sistema de Pagos](#fase-4-sistema-de-pagos)
5. [Fase 5: Deployment](#fase-5-deployment)

---

## Fase 1: Configuración Base

### 1.1 Actualizar Supabase Schema

Ya hemos creado `supabase-schema-saas.sql`. Ahora ejecutarlo:

```bash
# En Supabase Dashboard → SQL Editor
# Copiar y ejecutar el contenido de supabase-schema-saas.sql
```

**Tablas creadas:**
- `organizations` - Clientes/Tenants
- `team_members` - Usuarios por organización
- `customers` - Clientes de cada PyME
- `conversations` - Chats
- `messages` - Mensajes
- `products` - Catálogo
- `leads` - Oportunidades
- `sales` - Transacciones
- `activity_logs` - Auditoría

### 1.2 Actualizar Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp (Compartido para todos los clientes)
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Gemini (Compartido para todos los clientes)
GEMINI_API_KEY=your_gemini_api_key

# Admin
ADMIN_EMAIL=tu@email.com
ADMIN_PASSWORD=secure_password

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Fase 2: Autenticación Multi-Tenant

### 2.1 Crear Sistema de Autenticación

Ya hemos creado `lib/supabase/auth.ts`. Ahora crear el middleware:

```bash
mkdir -p /home/code/whatsapp-sales-agent/lib/middleware
```

```typescript
// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Middleware para verificar autenticación y organización
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, org: any) => Promise<NextResponse>
) {
  try {
    // Obtener usuario del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar token y obtener organización
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Obtener organización del usuario
    const { data: teamMember } = await supabaseServer
      .from('team_members')
      .select('organization_id, organizations(*)')
      .eq('email', user.email)
      .single()

    if (!teamMember) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      )
    }

    // Pasar a handler
    return handler(request, teamMember.organizations)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2.2 Crear Página de Login

```bash
mkdir -p /home/code/whatsapp-sales-agent/app/auth
```

```typescript
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error('Login failed')

      const { token } = await response.json()
      localStorage.setItem('auth_token', token)
      
      toast.success('Login successful')
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>WhatsApp Sales Agent</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2.3 Crear API de Autenticación

```bash
mkdir -p /home/code/whatsapp-sales-agent/app/api/auth/login
```

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Autenticar con Supabase
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return NextResponse.json({
      token: data.session?.access_token,
      user: data.user,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    )
  }
}
```

---

## Fase 3: Dashboard Admin

### 3.1 Crear API de Organizaciones

Ya creamos `/app/api/admin/organizations/route.ts`. Ahora agregar más endpoints:

```typescript
// app/api/admin/organizations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'
import { updateOrganization, logActivity } from '@/lib/supabase/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseServer
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const org = await updateOrganization(params.id, updates)
    
    // Log activity
    await logActivity(
      params.id,
      null,
      'organization',
      params.id,
      'updated',
      updates
    )

    return NextResponse.json(org)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
```

### 3.2 Crear Estadísticas del Admin

```typescript
// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Total de organizaciones
    const { count: totalOrgs } = await supabaseServer
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    // Organizaciones activas
    const { count: activeOrgs } = await supabaseServer
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    // Total de conversaciones
    const { count: totalConversations } = await supabaseServer
      .from('conversations')
      .select('*', { count: 'exact', head: true })

    // Total de ventas
    const { data: sales } = await supabaseServer
      .from('sales')
      .select('total_amount')
      .eq('status', 'completed')

    const totalRevenue = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

    return NextResponse.json({
      totalOrganizations: totalOrgs || 0,
      activeOrganizations: activeOrgs || 0,
      totalConversations: totalConversations || 0,
      totalRevenue,
      averageRevenuePerOrg: totalOrgs ? (totalRevenue / totalOrgs).toFixed(2) : 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
```

---

## Fase 4: Sistema de Pagos

### 4.1 Instalar Stripe

```bash
npm install stripe @stripe/stripe-js
```

### 4.2 Crear Tabla de Suscripciones

```sql
-- En Supabase SQL Editor
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

### 4.3 Crear API de Pagos

```typescript
// app/api/payments/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { organizationId, planId } = await request.json()

    // Obtener organización
    const { data: org } = await supabaseServer
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Crear o obtener cliente Stripe
    let stripeCustomerId = org.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: org.email,
        name: org.name,
        metadata: { organizationId },
      })
      stripeCustomerId = customer.id

      // Guardar en BD
      await supabaseServer
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', organizationId)
    }

    // Crear suscripción
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: planId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // Guardar en BD
    await supabaseServer.from('subscriptions').insert({
      organization_id: organizationId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
```

---

## Fase 5: Deployment

### 5.1 Preparar para Producción

```bash
# 1. Crear archivo .env.production
cp .env.example .env.production

# 2. Llenar variables de producción
# NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
# etc...

# 3. Build
npm run build

# 4. Verificar que no hay errores
npm run lint
```

### 5.2 Desplegar en Vercel

```bash
# 1. Conectar repositorio a Vercel
# https://vercel.com/new

# 2. Configurar variables de entorno en Vercel Dashboard
# Settings → Environment Variables

# 3. Deploy automático en cada push a main
```

### 5.3 Configurar Dominio Personalizado

```bash
# En Vercel Dashboard
# Settings → Domains
# Agregar tu dominio: saas.tudominio.com
```

### 5.4 Configurar Webhook de Stripe

```bash
# En Stripe Dashboard
# Developers → Webhooks
# Agregar endpoint: https://saas.tudominio.com/api/webhooks/stripe

# Eventos a escuchar:
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

---

## 🎯 Checklist de Implementación

### Semana 1: Base
- [ ] Actualizar schema Supabase
- [ ] Crear autenticación multi-tenant
- [ ] Crear página de login
- [ ] Crear dashboard básico

### Semana 2: Admin
- [ ] Crear admin dashboard
- [ ] Crear API de organizaciones
- [ ] Crear gestión de clientes
- [ ] Crear estadísticas

### Semana 3: Pagos
- [ ] Integrar Stripe
- [ ] Crear planes de suscripción
- [ ] Crear checkout
- [ ] Crear webhooks

### Semana 4: Producción
- [ ] Testing completo
- [ ] Optimización de performance
- [ ] Configurar monitoreo
- [ ] Deploy a producción

---

## 📊 Estructura de Carpetas Final

```
whatsapp-sales-agent/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── customers/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   └── settings/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── conversations/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── leads/page.tsx
│   │   ├── sales/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── customers/
│   │   ├── conversations/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   └── whatsapp/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── auth.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── gemini/
│   │   └── client.ts
│   └── whatsapp/
│       └── client.ts
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── admin/
├── .env.example
├── .env.local
├── supabase-schema-saas.sql
├── SAAS_ARCHITECTURE.md
└── SAAS_IMPLEMENTATION.md
```

---

## 🚀 Próximos Pasos

1. **Ejecutar schema SaaS** en Supabase
2. **Crear autenticación** con Supabase Auth
3. **Implementar admin dashboard**
4. **Integrar Stripe** para pagos
5. **Desplegar en Vercel**
6. **Configurar dominio personalizado**
7. **Lanzar beta con primeros clientes**

---

**¡Felicidades! Tienes una plataforma SaaS lista para escalar! 🎉**
