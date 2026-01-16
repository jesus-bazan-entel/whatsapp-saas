/**
 * WhatsApp Sales Agent - SaaS Multi-Tenant Database Schema
 * 
 * This schema supports multiple clients with complete data isolation
 * Each client's data is completely isolated at the database level
 */

-- ============================================================================
-- AUTHENTICATION & USERS (Shared across all tenants)
-- ============================================================================

-- Organizations/Tenants table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  max_conversations INT DEFAULT 100,
  max_products INT DEFAULT 50,
  max_team_members INT DEFAULT 5,
  whatsapp_phone_number TEXT,
  whatsapp_phone_number_id TEXT UNIQUE, -- Added for webhook mapping
  whatsapp_configured BOOLEAN DEFAULT false,
  gemini_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- ============================================================================
-- TENANT-SPECIFIC DATA (Isolated per organization)
-- ============================================================================

-- Customers table (per tenant)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'customer', 'inactive')),
  source TEXT DEFAULT 'whatsapp',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- Products table (per tenant)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  sku TEXT,
  category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (per tenant)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  assigned_to UUID REFERENCES team_members(id),
  last_message_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (per tenant)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent')),
  sender_id UUID REFERENCES team_members(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location')),
  product_id UUID REFERENCES products(id),
  whatsapp_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads/Opportunities table (per tenant)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10, 2),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  assigned_to UUID REFERENCES team_members(id),
  expected_close_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales/Transactions table (per tenant)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  lead_id UUID REFERENCES leads(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales items (per tenant)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log (per tenant)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_phone_id ON organizations(whatsapp_phone_number_id); -- Added for webhook lookup

-- Team member indexes
CREATE INDEX IF NOT EXISTS idx_team_members_organization ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_organization ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_organization ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);

-- Lead indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_organization ON sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Team members: Users can only see team members in their organization
CREATE POLICY "Users can view team members in their org" ON team_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Customers: Users can only see customers in their organization
CREATE POLICY "Users can view customers in their org" ON customers
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert customers in their org" ON customers
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can update customers in their org" ON customers
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Products: Users can only see products in their organization
CREATE POLICY "Users can view products in their org" ON products
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert products in their org" ON products
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Conversations: Users can only see conversations in their organization
CREATE POLICY "Users can view conversations in their org" ON conversations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert conversations in their org" ON conversations
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Messages: Users can only see messages in their organization
CREATE POLICY "Users can view messages in their org" ON messages
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

CREATE POLICY "Users can insert messages in their org" ON messages
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Leads: Users can only see leads in their organization
CREATE POLICY "Users can view leads in their org" ON leads
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- Sales: Users can only see sales in their organization
CREATE POLICY "Users can view sales in their org" ON sales
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE email = current_user_email())
  );

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample organization
INSERT INTO organizations (name, slug, email, subscription_plan) VALUES
  ('Demo Company', 'demo-company', 'demo@example.com', 'professional')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (organization_id, name, description, price, category) 
SELECT id, 'Premium Headphones', 'High-quality wireless headphones', 199.99, 'electronics'
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;

INSERT INTO products (organization_id, name, description, price, category) 
SELECT id, 'USB-C Cable', 'Durable charging cable', 19.99, 'accessories'
FROM organizations WHERE slug = 'demo-company'
ON CONFLICT DO NOTHING;
