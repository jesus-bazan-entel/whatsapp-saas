/**
 * WhatsApp Sales Bot - Database Schema Extensions
 *
 * Extensiones para soportar:
 * - Variantes de productos (tallas, colores)
 * - Características detalladas de productos
 * - Métodos de pago configurables
 * - Zonas de delivery con costos
 * - Transacciones y comprobantes de pago
 * - Procesamiento de imágenes (QR, comprobantes)
 */

-- ============================================================================
-- PRODUCTOS EXTENDIDOS - Variantes y Características
-- ============================================================================

-- Variantes de productos (tallas, colores, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- ej: "Talla M - Negro"
  sku TEXT, -- SKU específico de la variante

  -- Atributos de la variante
  size TEXT, -- ej: "S", "M", "L", "XL", "38", "40"
  color TEXT, -- ej: "Negro", "Blanco", "Rojo"
  material TEXT, -- ej: "Algodón", "Poliéster"

  -- Inventario y precio
  stock_quantity INT DEFAULT 0,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00, -- Diferencia de precio vs producto base

  -- Estado
  is_available BOOLEAN DEFAULT true,

  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Características de productos (base de conocimiento estructurada)
CREATE TABLE IF NOT EXISTS product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  feature_name TEXT NOT NULL, -- ej: "Material", "Garantía", "Dimensiones"
  feature_value TEXT NOT NULL, -- ej: "Algodón 100%", "12 meses", "30x40cm"
  feature_type TEXT DEFAULT 'text' CHECK (feature_type IN ('text', 'number', 'boolean', 'list')),

  display_order INT DEFAULT 0, -- Para ordenar características
  is_highlight BOOLEAN DEFAULT false, -- Si es una característica destacada

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONFIGURACIÓN DE PAGOS Y DELIVERY
-- ============================================================================

-- Métodos de pago disponibles por organización
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  method_type TEXT NOT NULL CHECK (method_type IN ('online', 'bank_transfer', 'qr_wallet', 'cash_on_delivery')),
  name TEXT NOT NULL, -- ej: "Transferencia Bancaria", "Yape", "Plin", "Stripe"
  description TEXT,

  -- Configuración específica del método
  config JSONB DEFAULT '{}', -- ej: {"account_number": "123456", "bank": "BCP"}

  -- Estado
  is_active BOOLEAN DEFAULT true,
  requires_proof BOOLEAN DEFAULT false, -- Si requiere comprobante de pago

  -- Instrucciones para el cliente
  instructions TEXT, -- Instrucciones de cómo pagar

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zonas de delivery con costos
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- ej: "Lima Metropolitana", "Provincias"
  description TEXT,

  -- Costo y tiempo estimado
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_days INT, -- Días estimados de entrega

  -- Zonas geográficas (puede ser lista de distritos, ciudades, etc.)
  areas TEXT[] DEFAULT '{}', -- ej: ["Miraflores", "San Isidro", "Surco"]

  -- Estado
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SISTEMA DE PAGOS Y TRANSACCIONES
-- ============================================================================

-- Transacciones de pago
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Información del pago
  payment_method_id UUID REFERENCES payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'PEN',

  -- Estado del pago
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Información de proveedores de pago (Stripe, MercadoPago, etc.)
  external_transaction_id TEXT, -- ID de transacción del proveedor
  payment_provider TEXT, -- ej: "stripe", "mercadopago", "manual"

  -- Metadatos
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprobantes de pago (imágenes subidas por clientes)
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,

  -- Información de la imagen
  image_url TEXT NOT NULL, -- URL de la imagen en Supabase Storage
  image_type TEXT CHECK (image_type IN ('bank_transfer', 'qr_payment', 'receipt', 'other')),

  -- Análisis AI de la imagen (usando Gemini Vision)
  ai_analysis JSONB DEFAULT '{}', -- Resultados del análisis
  ai_confidence DECIMAL(3, 2), -- Confianza del análisis (0.00-1.00)

  -- Información extraída
  extracted_amount DECIMAL(10, 2), -- Monto detectado en la imagen
  extracted_date TIMESTAMP WITH TIME ZONE, -- Fecha detectada
  extracted_reference TEXT, -- Número de referencia/operación

  -- Validación
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES team_members(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CARRITO DE COMPRAS (para tracking del proceso de venta)
-- ============================================================================

-- Carrito de compras del cliente
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  -- Estado del carrito
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),

  -- Información de delivery
  delivery_zone_id UUID REFERENCES delivery_zones(id),
  delivery_address TEXT,
  delivery_notes TEXT,

  -- Total calculado
  subtotal DECIMAL(10, 2) DEFAULT 0.00,
  delivery_cost DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) DEFAULT 0.00,

  -- Metadatos
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE, -- Expiración del carrito
  converted_at TIMESTAMP WITH TIME ZONE, -- Cuando se convirtió en venta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items del carrito
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Personalización o notas especiales
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_organization ON product_variants(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_available ON product_variants(is_available);

-- Product features indexes
CREATE INDEX IF NOT EXISTS idx_product_features_organization ON product_features(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_highlight ON product_features(is_highlight);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_organization ON payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(method_type);

-- Delivery zones indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_organization ON delivery_zones(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_organization ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);

-- Payment receipts indexes
CREATE INDEX IF NOT EXISTS idx_payment_receipts_organization ON payment_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_transaction ON payment_receipts(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_verified ON payment_receipts(is_verified);

-- Shopping carts indexes
CREATE INDEX IF NOT EXISTS idx_shopping_carts_organization ON shopping_carts(organization_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_customer ON shopping_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_conversation ON shopping_carts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_status ON shopping_carts(status);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_organization ON cart_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Product Variants RLS
CREATE POLICY "Users can view product variants in their org" ON product_variants
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert product variants in their org" ON product_variants
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can update product variants in their org" ON product_variants
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Product Features RLS
CREATE POLICY "Users can view product features in their org" ON product_features
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert product features in their org" ON product_features
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Payment Methods RLS
CREATE POLICY "Users can view payment methods in their org" ON payment_methods
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can manage payment methods in their org" ON payment_methods
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Delivery Zones RLS
CREATE POLICY "Users can view delivery zones in their org" ON delivery_zones
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can manage delivery zones in their org" ON delivery_zones
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Payment Transactions RLS
CREATE POLICY "Users can view payment transactions in their org" ON payment_transactions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert payment transactions in their org" ON payment_transactions
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Payment Receipts RLS
CREATE POLICY "Users can view payment receipts in their org" ON payment_receipts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert payment receipts in their org" ON payment_receipts
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Shopping Carts RLS
CREATE POLICY "Users can view shopping carts in their org" ON shopping_carts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can manage shopping carts in their org" ON shopping_carts
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Cart Items RLS
CREATE POLICY "Users can view cart items in their org" ON cart_items
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can manage cart items in their org" ON cart_items
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Insertar métodos de pago de ejemplo
INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions, config)
SELECT
  id,
  'bank_transfer',
  'Transferencia Bancaria BCP',
  'Transferencia o depósito bancario al Banco de Crédito del Perú',
  true,
  'Realizar transferencia a:\nBanco: BCP\nCuenta: 123-456789-0-12\nCCI: 00212312345678901234\nTitular: Demo Company SAC\n\nEnviar comprobante de pago por WhatsApp.',
  '{"bank": "BCP", "account_number": "123-456789-0-12", "cci": "00212312345678901234", "holder": "Demo Company SAC"}'::jsonb
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions, config)
SELECT
  id,
  'qr_wallet',
  'Yape',
  'Pago mediante Yape escaneando el código QR',
  true,
  'Escanea el código QR con tu app Yape:\n[QR se mostrará automáticamente]\n\nEnvía captura del comprobante de pago.',
  '{"phone": "987654321", "qr_url": "https://example.com/yape-qr.png"}'::jsonb
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions, config)
SELECT
  id,
  'qr_wallet',
  'Plin',
  'Pago mediante Plin',
  true,
  'Realiza el pago con Plin al número: 987-654-321\n\nEnvía captura del comprobante de pago.',
  '{"phone": "987654321"}'::jsonb
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (organization_id, method_type, name, description, requires_proof, instructions)
SELECT
  id,
  'cash_on_delivery',
  'Pago Contra Entrega',
  'Pago en efectivo al recibir tu pedido',
  false,
  'Prepara el monto exacto para facilitar la entrega.'
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

-- Insertar zonas de delivery de ejemplo
INSERT INTO delivery_zones (organization_id, name, description, cost, estimated_days, areas)
SELECT
  id,
  'Lima Metropolitana',
  'Delivery en distritos de Lima',
  15.00,
  1,
  ARRAY['Miraflores', 'San Isidro', 'Surco', 'La Molina', 'San Borja', 'Barranco', 'Magdalena', 'Jesús María', 'Lince', 'Pueblo Libre']
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_zones (organization_id, name, description, cost, estimated_days, areas)
SELECT
  id,
  'Lima Norte',
  'Delivery en distritos del norte de Lima',
  20.00,
  2,
  ARRAY['Los Olivos', 'San Martín de Porres', 'Independencia', 'Comas', 'Carabayllo']
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_zones (organization_id, name, description, cost, estimated_days, areas)
SELECT
  id,
  'Callao',
  'Delivery en provincia del Callao',
  25.00,
  2,
  ARRAY['Callao', 'Bellavista', 'La Perla', 'La Punta', 'Ventanilla']
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

-- Agregar variantes al producto Premium Headphones
INSERT INTO product_variants (organization_id, product_id, name, size, color, stock_quantity, price_adjustment)
SELECT
  p.organization_id,
  p.id,
  'Negro',
  NULL,
  'Negro',
  50,
  0.00
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (organization_id, product_id, name, size, color, stock_quantity, price_adjustment)
SELECT
  p.organization_id,
  p.id,
  'Blanco',
  NULL,
  'Blanco',
  30,
  10.00
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;

-- Agregar características al producto Premium Headphones
INSERT INTO product_features (organization_id, product_id, feature_name, feature_value, is_highlight, display_order)
SELECT
  p.organization_id,
  p.id,
  'Conectividad',
  'Bluetooth 5.0',
  true,
  1
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;

INSERT INTO product_features (organization_id, product_id, feature_name, feature_value, is_highlight, display_order)
SELECT
  p.organization_id,
  p.id,
  'Batería',
  'Hasta 30 horas de reproducción',
  true,
  2
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;

INSERT INTO product_features (organization_id, product_id, feature_name, feature_value, display_order)
SELECT
  p.organization_id,
  p.id,
  'Cancelación de ruido',
  'Cancelación activa de ruido (ANC)',
  3
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;

INSERT INTO product_features (organization_id, product_id, feature_name, feature_value, display_order)
SELECT
  p.organization_id,
  p.id,
  'Garantía',
  '12 meses',
  4
FROM products p
WHERE p.name = 'Premium Headphones'
ON CONFLICT DO NOTHING;
