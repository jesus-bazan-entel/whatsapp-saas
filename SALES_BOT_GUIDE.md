# 🛍️ Guía Completa del Bot de Ventas por WhatsApp

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Características Principales](#características-principales)
3. [Configuración Inicial](#configuración-inicial)
4. [Gestión de Productos](#gestión-de-productos)
5. [Configuración de Pagos](#configuración-de-pagos)
6. [Configuración de Delivery](#configuración-de-delivery)
7. [Uso del Bot de Ventas](#uso-del-bot-de-ventas)
8. [Dashboard de Analytics](#dashboard-de-analytics)
9. [Gestión de Transacciones](#gestión-de-transacciones)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 📖 Introducción

Este sistema es un **bot de ventas automatizado** que funciona a través de WhatsApp, permitiendo:

- ✅ Consultas de productos con información detallada
- ✅ Carrito de compras interactivo
- ✅ Procesamiento de pagos con validación automática de comprobantes
- ✅ Análisis de imágenes con IA (Gemini Vision)
- ✅ Dashboard con analytics en tiempo real
- ✅ Gestión multi-tenant (SaaS)

---

## 🌟 Características Principales

### 1. **Bot de WhatsApp Inteligente**
- Respuestas automáticas con IA (Google Gemini)
- Base de conocimiento estructurada de productos
- Comandos de carrito de compras
- Procesamiento de imágenes para validar pagos

### 2. **Catálogo de Productos Completo**
- Productos con variantes (tallas, colores)
- Características destacadas
- Gestión de inventario por variante
- Categorización

### 3. **Sistema de Pagos**
- Múltiples métodos de pago
- Validación automática de comprobantes con IA
- Detección de QR de pagos (Yape, Plin)
- Verificación manual opcional

### 4. **Dashboard Interactivo**
- Analytics en tiempo real
- Gráficas de ventas
- Monitoreo de transacciones
- Gestión de clientes

---

## ⚙️ Configuración Inicial

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_VERIFY_TOKEN=tu_verify_token_personalizado

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production
```

### Paso 2: Ejecutar Migraciones de Base de Datos

```bash
# 1. Ejecutar schema principal
psql -U postgres -d tu_database -f supabase-schema-saas.sql

# 2. Ejecutar extensiones (productos, pagos, delivery)
psql -U postgres -d tu_database -f supabase-schema-extensions.sql
```

### Paso 3: Configurar WhatsApp Webhook

1. En Facebook Developer Console:
   - Ve a tu app de WhatsApp Business
   - Configura Webhook URL: `https://tu-dominio.com/api/whatsapp/webhook`
   - Verify Token: El valor de `WHATSAPP_VERIFY_TOKEN`
   - Suscríbete a eventos: `messages`

2. En la base de datos:
   ```sql
   UPDATE organizations
   SET whatsapp_phone_number_id = 'tu_phone_number_id',
       whatsapp_configured = true
   WHERE slug = 'tu-organizacion';
   ```

### Paso 4: Instalar Dependencias y Ejecutar

```bash
npm install
npm run dev
```

---

## 📦 Gestión de Productos

### Crear un Producto Básico

Ve a `/dashboard/products` y crea un producto con:

- **Nombre**: Nombre del producto
- **Descripción**: Descripción detallada
- **Precio Base**: Precio en soles (PEN)
- **Categoría**: Categoría del producto
- **Imagen**: URL de imagen del producto

### Agregar Variantes (Tallas, Colores)

Para productos con variantes:

```sql
-- Ejemplo: Agregar tallas a una polera
INSERT INTO product_variants (organization_id, product_id, name, size, color, stock_quantity, price_adjustment)
VALUES
  ('org-uuid', 'product-uuid', 'Talla S - Negro', 'S', 'Negro', 50, 0.00),
  ('org-uuid', 'product-uuid', 'Talla M - Negro', 'M', 'Negro', 100, 0.00),
  ('org-uuid', 'product-uuid', 'Talla L - Negro', 'L', 'Negro', 75, 0.00),
  ('org-uuid', 'product-uuid', 'Talla S - Blanco', 'S', 'Blanco', 30, 5.00); -- +S/5 por color blanco
```

### Agregar Características Destacadas

```sql
-- Ejemplo: Características de unos audífonos
INSERT INTO product_features (organization_id, product_id, feature_name, feature_value, is_highlight, display_order)
VALUES
  ('org-uuid', 'product-uuid', 'Conectividad', 'Bluetooth 5.0', true, 1),
  ('org-uuid', 'product-uuid', 'Batería', 'Hasta 30 horas', true, 2),
  ('org-uuid', 'product-uuid', 'Cancelación de ruido', 'ANC activo', true, 3),
  ('org-uuid', 'product-uuid', 'Garantía', '12 meses', false, 4);
```

---

## 💳 Configuración de Pagos

### Métodos de Pago Disponibles

1. **Transferencia Bancaria**
2. **Billeteras Digitales (Yape, Plin)**
3. **Pago Contra Entrega**
4. **Pago Online (Stripe/MercadoPago)** - Próximamente

### Configurar Método de Pago: Transferencia Bancaria

```sql
INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions, config)
VALUES (
  'tu-org-uuid',
  'bank_transfer',
  'Transferencia Bancaria BCP',
  'Transferencia o depósito al Banco de Crédito del Perú',
  true,
  'Realizar transferencia a:

Banco: BCP
Cuenta: 123-456789-0-12
CCI: 00212312345678901234
Titular: Tu Empresa SAC

Enviar comprobante de pago por WhatsApp.',
  '{"bank": "BCP", "account_number": "123-456789-0-12", "cci": "00212312345678901234"}'::jsonb
);
```

### Configurar Yape/Plin

```sql
INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions, config)
VALUES (
  'tu-org-uuid',
  'qr_wallet',
  'Yape',
  'Pago mediante Yape',
  true,
  'Realiza el pago con Yape al número: 987-654-321

Envía captura del comprobante de pago.',
  '{"phone": "987654321", "qr_url": "https://tu-sitio.com/yape-qr.png"}'::jsonb
);
```

### Cómo Funciona la Validación Automática de Comprobantes

1. **Cliente envía comprobante** por WhatsApp (imagen)
2. **El bot detecta** que es una imagen y busca pagos pendientes
3. **Gemini Vision analiza** la imagen y extrae:
   - Monto del pago
   - Fecha de transacción
   - Número de referencia
   - Banco/método de pago
4. **Validación automática**:
   - Si confianza > 70% → Estado: "Procesando"
   - Si confianza < 70% → Estado: "Requiere verificación manual"
5. **Confirmación al cliente** con resumen del análisis

---

## 🚚 Configuración de Delivery

### Crear Zonas de Delivery

```sql
INSERT INTO delivery_zones (organization_id, name, description, cost, estimated_days, areas)
VALUES
  (
    'tu-org-uuid',
    'Lima Metropolitana',
    'Delivery en distritos principales de Lima',
    15.00,  -- S/15 de costo
    1,      -- 1 día de entrega
    ARRAY['Miraflores', 'San Isidro', 'Surco', 'La Molina', 'San Borja']
  ),
  (
    'tu-org-uuid',
    'Callao',
    'Delivery en provincia del Callao',
    25.00,
    2,
    ARRAY['Callao', 'Bellavista', 'La Perla', 'Ventanilla']
  );
```

---

## 🤖 Uso del Bot de Ventas

### Comandos del Cliente

El bot reconoce los siguientes comandos:

| Comando | Acción |
|---------|--------|
| `ver carrito` / `mi carrito` | Muestra el contenido del carrito |
| `agregar [producto]` | Agrega un producto al carrito |
| `comprar` / `finalizar compra` | Inicia el proceso de checkout |
| `métodos de pago` | Lista los métodos de pago disponibles |
| `delivery` / `envío` | Información sobre zonas de delivery |

### Flujo de Venta Completo

```
1. 👤 Cliente: "Hola, busco audífonos bluetooth"
   🤖 Bot: "¡Hola! Tenemos estos audífonos disponibles:

           **Premium Headphones**
           - Precio: S/ 199.99
           - Bluetooth 5.0
           - Batería: 30 horas
           - Cancelación de ruido activa

           Variantes:
           • Negro - S/ 199.99
           • Blanco - S/ 209.99

           ¿Cuál te interesa?"

2. 👤 Cliente: "El negro, agrégalo a mi carrito"
   🤖 Bot: "✅ Agregado: Premium Headphones - Negro al carrito.

           Total: S/ 199.99

           ¿Deseas agregar algo más?"

3. 👤 Cliente: "Ver carrito"
   🤖 Bot: "🛒 **Tu Carrito:**

           1. Premium Headphones - Negro
              Cantidad: 1 × S/ 199.99 = S/ 199.99

           **TOTAL:** S/ 199.99

           ¿Deseas finalizar tu compra?"

4. 👤 Cliente: "Comprar"
   🤖 Bot: "🛍️ ¡Perfecto! Vamos a finalizar tu compra.

           Total a pagar: S/ 199.99

           Por favor:
           1. Tu dirección de entrega
           2. ¿En qué zona te encuentras?"

5. 👤 Cliente: "Av. Larco 123, Miraflores"
   🤖 Bot: "Perfecto! Delivery a Miraflores: S/ 15.00

           Total final: S/ 214.99

           Métodos de pago:
           1. Transferencia Bancaria BCP
           2. Yape
           3. Plin

           ¿Cómo deseas pagar?"

6. 👤 Cliente: "Yape"
   🤖 Bot: "💳 **Pago con Yape**

           Realiza el pago al número: 987-654-321
           Monto: S/ 214.99

           Envía captura del comprobante cuando lo hayas realizado."

7. 👤 Cliente: [Envía imagen del comprobante]
   🤖 Bot: "✅ ¡Recibimos tu comprobante de pago!

           📊 **Análisis:**
           - Monto detectado: S/ 214.99
           - Referencia: 123456789
           - Confianza: 95%

           Tu pago está en verificación. Te confirmaremos en breve. ⏳"

8. [Staff verifica en dashboard]

9. 🤖 Bot: "✅ ¡Pago confirmado!

           Tu pedido está en proceso.
           Llegarás en 1 día hábil a:
           Av. Larco 123, Miraflores

           ¡Gracias por tu compra! 🎉"
```

### Personalizar Respuestas del Bot

Edita el system prompt en `/lib/sales-bot/index.ts`:

```typescript
export async function createSalesSystemPrompt(organizationId: string): Promise<string> {
  // ... código existente ...

  return `Eres un asistente de ventas profesional y amigable por WhatsApp...

  // Personaliza aquí el tono, personalidad y reglas del bot
  `
}
```

---

## 📊 Dashboard de Analytics

### Acceder al Dashboard

Ve a `/dashboard/analytics` para ver:

#### KPIs Principales
- **Ingresos Totales**: Suma de ventas completadas
- **Total Ventas**: Cantidad de transacciones
- **Tasa de Conversión**: % de conversaciones que resultan en venta
- **Pagos**: Completados vs. pendientes

#### Gráficas Disponibles

1. **Ingresos por Día** (Area Chart)
   - Visualiza tendencia de ingresos diarios
   - Identifica días de mayor venta

2. **Productos Más Vendidos** (Bar Chart)
   - Top 5 productos por ingresos
   - Ayuda a identificar productos estrella

3. **Estado de Ventas** (Pie Chart)
   - Distribución: Pendiente/Completado/Cancelado
   - Monitorea tasa de éxito

4. **Métodos de Pago** (Bar Chart)
   - Ingresos por método de pago
   - Identifica preferencias de clientes

### Filtros de Tiempo

- **7 días**: Vista semanal
- **30 días**: Vista mensual (por defecto)
- **90 días**: Vista trimestral

### Actualización en Tiempo Real

El dashboard se actualiza automáticamente cada 30 segundos con:
- Nuevas ventas
- Cambios de estado
- Pagos confirmados

---

## 💰 Gestión de Transacciones

### Vista de Transacciones en Tiempo Real

Ve a `/dashboard/transactions` para:

#### Monitoreo en Vivo
- **Indicador verde parpadeante**: Sistema en vivo
- **Actualización automática**: Vía Supabase Realtime
- **Sin recarga de página**: Cambios instantáneos

#### Información por Transacción

Para cada transacción verás:
- Cliente (nombre y teléfono)
- Monto
- Método de pago
- Estado actual
- Comprobante (si se subió)
- Fecha y hora

#### Estados de Pago

| Estado | Descripción |
|--------|-------------|
| 🟡 **Pendiente** | Esperando pago del cliente |
| 🔵 **Procesando** | Comprobante recibido, en verificación |
| 🟢 **Completado** | Pago verificado y confirmado |
| 🔴 **Fallido** | Pago rechazado o inválido |
| ⚫ **Cancelado** | Transacción cancelada |

### Verificar Pagos Manualmente

1. Click en icono 👁️ (ojo) de la transacción
2. Revisa el comprobante de pago
3. Verifica:
   - Monto coincide
   - Fecha reciente
   - Número de referencia válido
4. Click en **"Verificar Pago"**
5. El sistema automáticamente:
   - Actualiza estado a "Completado"
   - Marca sale como "Completado"
   - Envía confirmación al cliente por WhatsApp

### Análisis de Comprobantes con IA

Cuando un cliente envía una imagen:

```
Gemini Vision extrae:
├── Monto del pago
├── Fecha de transacción
├── Número de referencia/operación
├── Banco o método de pago
└── Confianza del análisis (0-100%)

Si confianza ≥ 70%:
  ✓ Auto-procesar
  ✓ Marcar como "Procesando"
  ✓ Notificar al cliente

Si confianza < 70%:
  ⚠ Requiere verificación manual
  ⚠ Listar advertencias
  ⚠ Notificar al staff
```

---

## ❓ Preguntas Frecuentes

### ¿Cómo agrego más productos?

1. Ve a `/dashboard/products`
2. Click en "Nuevo Producto"
3. Llena información básica
4. Para agregar variantes, usa SQL o crea una interfaz personalizada

### ¿Puedo usar mi propio modelo de IA?

Sí, edita `/lib/gemini/client.ts` y cambia:

```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
// Cambia a otro modelo disponible
```

### ¿Cómo personalizo los mensajes del bot?

Edita `/lib/sales-bot/index.ts` en la función `createSalesSystemPrompt()`.

### ¿Soporta múltiples organizaciones (multi-tenant)?

¡Sí! El sistema está diseñado como SaaS multi-tenant:
- Cada organización tiene su `whatsapp_phone_number_id`
- Datos completamente aislados con RLS (Row Level Security)
- Un número de WhatsApp por organización

### ¿Cómo integro Stripe o MercadoPago?

Próximamente se agregarán integraciones nativas. Por ahora:

1. Crea un método de pago con `method_type = 'online'`
2. Configura webhook de tu proveedor
3. Actualiza estado de payment_transaction cuando se confirme

### ¿El bot funciona 24/7?

Sí, mientras:
- Tu servidor esté en ejecución
- WhatsApp webhook esté configurado
- Gemini API key sea válida

### ¿Qué pasa si falla el análisis de un comprobante?

El sistema:
1. Marca como "Requiere verificación manual"
2. Notifica al staff en dashboard
3. Lista las advertencias detectadas
4. Staff verifica manualmente

### ¿Puedo personalizar las zonas de delivery?

Sí, edita la tabla `delivery_zones`:

```sql
INSERT INTO delivery_zones (organization_id, name, cost, estimated_days, areas)
VALUES ('org-uuid', 'Mi Zona', 10.00, 1, ARRAY['Distrito1', 'Distrito2']);
```

### ¿Cómo exporto datos de ventas?

Usa la API `/api/analytics/sales` con parámetros:
- `organizationId`: Tu organización
- `days`: Rango de días (7, 30, 90, etc.)

Ejemplo:
```bash
curl "https://tu-dominio.com/api/analytics/sales?organizationId=xxx&days=30"
```

---

## 🎉 ¡Listo para Vender!

Tu bot de ventas por WhatsApp está configurado y listo para automatizar tu negocio.

**Próximos pasos recomendados:**

1. ✅ Agrega tus productos con variantes
2. ✅ Configura métodos de pago
3. ✅ Define zonas de delivery
4. ✅ Prueba el flujo completo
5. ✅ Personaliza mensajes del bot
6. ✅ Monitorea analytics

**Soporte:**
- GitHub Issues: [tu-repo]/issues
- Email: soporte@tu-empresa.com
- Documentación API: `/API_DOCUMENTATION.md`

---

**Desarrollado con ❤️ usando Next.js, Supabase y Google Gemini**
