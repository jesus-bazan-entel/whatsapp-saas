# WhatsApp Sales Agent - SaaS Platform Architecture

## 🎯 Visión General

Plataforma SaaS multi-cliente que permite a pequeñas y medianas empresas (PyMEs) automatizar sus ventas a través de WhatsApp con IA.

### Modelo de Negocio
- **Tú (Super Admin):** Propietario de la plataforma
- **Clientes (PyMEs):** Empresas que usan la plataforma para vender
- **Datos Aislados:** Cada cliente tiene sus datos completamente separados

## 🏗️ Arquitectura Multi-Tenant

### Niveles de Aislamiento

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATAFORMA SAAS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │   Cliente 1      │  │   Cliente 2      │  │ Cliente N│  │
│  │   (PyME A)       │  │   (PyME B)       │  │ (PyME Z) │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────┤  │
│  │ Org ID: UUID-1   │  │ Org ID: UUID-2   │  │ Org ID:  │  │
│  │                  │  │                  │  │ UUID-N   │  │
│  │ Customers        │  │ Customers        │  │ Customers│  │
│  │ Conversations    │  │ Conversations    │  │ Conversa-│  │
│  │ Messages         │  │ Messages         │  │ tions    │  │
│  │ Products         │  │ Products         │  │ Messages │  │
│  │ Sales            │  │ Sales            │  │ Products │  │
│  │ Leads            │  │ Leads            │  │ Sales    │  │
│  └──────────────────┘  └──────────────────┘  └──────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         SUPABASE DATABASE (PostgreSQL)              │   │
│  │  - Row Level Security (RLS) por organization_id     │   │
│  │  - Aislamiento completo de datos                    │   │
│  │  - Índices para performance                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Estructura de Base de Datos

### Tablas Compartidas (Globales)
```sql
organizations          -- Clientes/Tenants
team_members          -- Usuarios de cada cliente
```

### Tablas por Tenant (Aisladas)
```sql
customers             -- Clientes del negocio del usuario
conversations         -- Chats con clientes
messages              -- Mensajes de WhatsApp
products              -- Catálogo de productos
leads                 -- Oportunidades de venta
sales                 -- Transacciones completadas
sale_items            -- Items de cada venta
activity_logs         -- Auditoría de acciones
```

### Aislamiento con organization_id

Cada tabla tiene una columna `organization_id` que:
- Vincula todos los datos a una organización específica
- Se usa en Row Level Security (RLS) para filtrar datos
- Garantiza que un cliente NO puede ver datos de otro

```sql
-- Ejemplo: Un cliente solo ve sus propios clientes
SELECT * FROM customers 
WHERE organization_id = 'uuid-del-cliente-actual'
```

## 🔐 Seguridad Multi-Tenant

### Row Level Security (RLS)

```sql
-- Política: Los usuarios solo ven datos de su organización
CREATE POLICY "Users can view customers in their org" ON customers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE email = current_user_email()
    )
  );
```

### Niveles de Acceso

```
┌─────────────────────────────────────────┐
│         SUPER ADMIN (Tú)                │
├─────────────────────────────────────────┤
│ • Ver todas las organizaciones          │
│ • Crear nuevos clientes                 │
│ • Gestionar suscripciones               │
│ • Ver métricas globales                 │
│ • Acceso a /admin dashboard             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    ADMIN DE CLIENTE (Dueño PyME)        │
├─────────────────────────────────────────┤
│ • Ver solo sus datos                    │
│ • Gestionar equipo                      │
│ • Configurar WhatsApp                   │
│ • Ver reportes                          │
│ • Acceso a /dashboard                   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    MANAGER/MEMBER (Vendedor)            │
├─────────────────────────────────────────┤
│ • Ver conversaciones                    │
│ • Responder mensajes                    │
│ • Crear leads/ventas                    │
│ • Ver reportes limitados                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    VIEWER (Solo lectura)                │
├─────────────────────────────────────────┤
│ • Ver datos                             │
│ • No puede editar                       │
│ • No puede crear                        │
└─────────────────────────────────────────┘
```

## 🚀 Flujo de Onboarding de Cliente

```
1. REGISTRO
   ├─ Cliente se registra en la plataforma
   ├─ Se crea una nueva Organization
   └─ Se asigna como Admin/Owner

2. CONFIGURACIÓN INICIAL
   ├─ Configura datos de empresa
   ├─ Invita a miembros del equipo
   └─ Sube catálogo de productos

3. INTEGRACIÓN WHATSAPP
   ├─ Obtiene credenciales de WhatsApp Business
   ├─ Configura webhook en Meta Dashboard
   ├─ Verifica conexión
   └─ Comienza a recibir mensajes

4. CONFIGURACIÓN IA
   ├─ Obtiene API key de Gemini
   ├─ Configura prompts personalizados
   └─ Entrena el modelo con sus productos

5. OPERACIÓN
   ├─ Recibe mensajes de clientes
   ├─ IA responde automáticamente
   ├─ Gestiona leads y ventas
   └─ Monitorea métricas
```

## 💾 Aislamiento de Datos en Práctica

### Ejemplo: Cliente A vs Cliente B

```
CLIENTE A (Organization ID: uuid-a)
├─ Customers
│  ├─ Juan (phone: +51999999999)
│  └─ María (phone: +51988888888)
├─ Products
│  ├─ Laptop ($1000)
│  └─ Mouse ($50)
└─ Sales
   └─ Venta a Juan: $1050

CLIENTE B (Organization ID: uuid-b)
├─ Customers
│  ├─ Carlos (phone: +34666666666)
│  └─ Ana (phone: +34655555555)
├─ Products
│  ├─ Camiseta ($20)
│  └─ Pantalón ($40)
└─ Sales
   └─ Venta a Carlos: $60

GARANTÍA: Cliente A NUNCA ve datos de Cliente B
```

### Query con Aislamiento

```typescript
// Cuando Cliente A hace login
const organizationId = 'uuid-a'

// Obtiene SOLO sus clientes
const customers = await supabaseClient
  .from('customers')
  .select('*')
  .eq('organization_id', organizationId)
  // Resultado: Solo Juan y María

// Si intenta acceder a datos de Cliente B
const hackerQuery = await supabaseClient
  .from('customers')
  .select('*')
  .eq('organization_id', 'uuid-b')
  // Resultado: Error - RLS policy rechaza la query
```

## 📈 Modelo de Suscripción

```
┌─────────────────────────────────────────────────────┐
│              PLANES DE SUSCRIPCIÓN                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STARTER ($29/mes)                                  │
│  ├─ 100 conversaciones activas                      │
│  ├─ 50 productos                                    │
│  ├─ 5 miembros del equipo                           │
│  ├─ Soporte por email                               │
│  └─ Reportes básicos                                │
│                                                     │
│  PROFESSIONAL ($99/mes)                             │
│  ├─ 500 conversaciones activas                      │
│  ├─ 200 productos                                   │
│  ├─ 20 miembros del equipo                          │
│  ├─ Soporte prioritario                             │
│  ├─ Reportes avanzados                              │
│  └─ API access                                      │
│                                                     │
│  ENTERPRISE (Custom)                                │
│  ├─ Conversaciones ilimitadas                       │
│  ├─ Productos ilimitados                            │
│  ├─ Miembros ilimitados                             │
│  ├─ Soporte 24/7                                    │
│  ├─ Reportes personalizados                         │
│  ├─ Integración personalizada                       │
│  └─ SLA garantizado                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔧 Configuración por Cliente

### WhatsApp Business API

Cada cliente configura sus propias credenciales:

```typescript
// Cliente A
organization.whatsapp_phone_number = '+51999999999'
organization.whatsapp_configured = true

// Cliente B
organization.whatsapp_phone_number = '+34666666666'
organization.whatsapp_configured = true

// Cada uno recibe mensajes de SUS clientes
```

### Gemini API

Cada cliente puede:
- Usar la API key compartida de la plataforma (opción 1)
- Usar su propia API key (opción 2)

```typescript
// Opción 1: API key compartida
const geminiKey = process.env.GEMINI_API_KEY

// Opción 2: API key por cliente
const geminiKey = organization.gemini_api_key || process.env.GEMINI_API_KEY
```

## 📊 Dashboard del Super Admin

```
/admin
├─ Estadísticas Globales
│  ├─ Total de clientes
│  ├─ Ingresos mensuales
│  ├─ Conversaciones totales
│  └─ Tasa de conversión promedio
│
├─ Gestión de Clientes
│  ├─ Listar todos los clientes
│  ├─ Crear nuevo cliente
│  ├─ Editar plan de suscripción
│  ├─ Ver detalles de cliente
│  └─ Suspender/Cancelar
│
├─ Monitoreo de Integraciones
│  ├─ Estado de WhatsApp
│  ├─ Estado de Gemini
│  ├─ Logs de errores
│  └─ Uso de API
│
├─ Gestión de Suscripciones
│  ├─ Planes activos
│  ├─ Pagos pendientes
│  ├─ Renovaciones
│  └─ Reportes de ingresos
│
└─ Configuración de Plataforma
   ├─ Límites globales
   ├─ Precios
   ├─ Políticas
   └─ Integraciones
```

## 🔄 Flujo de Mensaje Multi-Tenant

```
Cliente A envía mensaje a su cliente
        ↓
Webhook recibe en /api/whatsapp/webhook
        ↓
Sistema identifica organization_id del cliente
        ↓
Crea/actualiza customer en BD (con organization_id)
        ↓
Crea conversation (con organization_id)
        ↓
Almacena mensaje (con organization_id)
        ↓
Gemini genera respuesta
        ↓
Envía respuesta a Cliente A (su número de WhatsApp)
        ↓
Almacena respuesta (con organization_id)
        ↓
Dashboard de Cliente A se actualiza en tiempo real
        ↓
Dashboard de Cliente B NO ve nada (RLS lo bloquea)
```

## 🛡️ Protecciones de Seguridad

### 1. Row Level Security (RLS)
- Cada query filtra automáticamente por organization_id
- Imposible acceder a datos de otro cliente

### 2. Validación en API
```typescript
// Verificar que el usuario pertenece a la organización
const userOrg = await getCurrentOrganization(userId)
if (userOrg.id !== requestedOrgId) {
  throw new Error('Unauthorized')
}
```

### 3. Auditoría
- Cada acción se registra en activity_logs
- Incluye: usuario, acción, cambios, timestamp
- Permite detectar accesos no autorizados

### 4. Límites por Plan
```typescript
// Verificar límites antes de crear
const hasReachedLimit = await checkOrganizationLimits(
  organizationId, 
  'conversations'
)
if (hasReachedLimit) {
  throw new Error('Plan limit reached')
}
```

## 📱 Experiencia del Cliente

### Dashboard del Cliente
```
/dashboard
├─ Estadísticas
│  ├─ Clientes totales
│  ├─ Conversaciones activas
│  ├─ Tasa de conversión
│  └─ Ingresos
│
├─ Conversaciones
│  ├─ Listar chats
│  ├─ Ver detalles
│  ├─ Responder mensajes
│  └─ Asignar a vendedor
│
├─ Clientes
│  ├─ Listar clientes
│  ├─ Ver historial
│  ├─ Editar información
│  └─ Etiquetar
│
├─ Leads
│  ├─ Crear lead
│  ├─ Seguimiento
│  ├─ Convertir a venta
│  └─ Reportes
│
├─ Ventas
│  ├─ Historial de ventas
│  ├─ Detalles de transacción
│  ├─ Reportes
│  └─ Exportar datos
│
├─ Productos
│  ├─ Catálogo
│  ├─ Agregar producto
│  ├─ Editar precios
│  └─ Gestionar inventario
│
├─ Equipo
│  ├─ Miembros
│  ├─ Invitar usuario
│  ├─ Asignar roles
│  └─ Permisos
│
└─ Configuración
   ├─ Datos de empresa
   ├─ WhatsApp
   ├─ Gemini
   ├─ Suscripción
   └─ Facturación
```

## 💰 Modelo de Ingresos

```
INGRESOS MENSUALES = Σ(Suscripciones Activas)

Ejemplo:
├─ 10 clientes en plan Starter @ $29 = $290
├─ 5 clientes en plan Professional @ $99 = $495
├─ 2 clientes en plan Enterprise @ $500 = $1000
└─ TOTAL MENSUAL = $1785

Proyección Anual:
├─ Mes 1: $1785
├─ Mes 6: $5000 (crecimiento)
├─ Mes 12: $15000 (escala)
└─ AÑO 1: ~$100,000
```

## 🚀 Roadmap de Implementación

### Fase 1: MVP (Semanas 1-4)
- [x] Esquema multi-tenant
- [x] Autenticación básica
- [x] Dashboard del cliente
- [x] Integración WhatsApp
- [x] IA Gemini
- [ ] Admin dashboard básico

### Fase 2: Producción (Semanas 5-8)
- [ ] Sistema de pagos (Stripe)
- [ ] Gestión de suscripciones
- [ ] Admin dashboard completo
- [ ] Reportes avanzados
- [ ] API pública

### Fase 3: Escalabilidad (Semanas 9-12)
- [ ] Optimización de BD
- [ ] Caché distribuido
- [ ] CDN para assets
- [ ] Monitoreo 24/7
- [ ] Backup automático

### Fase 4: Expansión (Mes 4+)
- [ ] Integraciones adicionales
- [ ] Marketplace de apps
- [ ] Comunidad de usuarios
- [ ] Certificaciones
- [ ] Soporte multiidioma

## 📞 Soporte al Cliente

### Niveles de Soporte

```
STARTER
├─ Email support
├─ Respuesta en 48h
└─ Base de conocimiento

PROFESSIONAL
├─ Email + Chat
├─ Respuesta en 24h
├─ Webinars mensuales
└─ Documentación completa

ENTERPRISE
├─ Email + Chat + Teléfono
├─ Respuesta en 4h
├─ Soporte dedicado
├─ Capacitación personalizada
└─ SLA 99.9%
```

## 🎓 Capacitación de Clientes

```
ONBOARDING
├─ Video tutorial (5 min)
├─ Guía de configuración
├─ Llamada de setup (30 min)
└─ Acceso a comunidad

CAPACITACIÓN CONTINUA
├─ Webinars semanales
├─ Blog con tips
├─ Casos de éxito
└─ Certificación de usuario
```

## 📊 Métricas Clave

### Para Ti (Super Admin)
- MRR (Monthly Recurring Revenue)
- Churn rate
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- NPS (Net Promoter Score)

### Para Clientes
- Conversaciones por mes
- Tasa de conversión
- Valor promedio de venta
- Tiempo de respuesta
- Satisfacción del cliente

## 🔗 Integración con Otros Servicios

```
┌─────────────────────────────────────┐
│     WHATSAPP SALES AGENT SAAS       │
├─────────────────────────────────────┤
│                                     │
├─ WhatsApp Business API              │
├─ Google Gemini 3                    │
├─ Supabase (PostgreSQL)              │
├─ Stripe (Pagos)                     │
├─ SendGrid (Email)                   │
├─ Twilio (SMS opcional)              │
├─ Zapier (Automatización)            │
├─ Google Analytics                   │
├─ Sentry (Error tracking)            │
└─ Vercel (Hosting)                   │
```

---

**Esta arquitectura garantiza:**
- ✅ Aislamiento completo de datos
- ✅ Escalabilidad infinita
- ✅ Seguridad de nivel empresarial
- ✅ Cumplimiento de GDPR/CCPA
- ✅ Experiencia de usuario consistente
- ✅ Modelo de negocio sostenible
