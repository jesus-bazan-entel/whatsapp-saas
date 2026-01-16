# Test Multi-tenant WhatsApp Webhook (Local)

## 1) Prerequisites

1. Start your dev server:

```bash
npm run dev
```

2. Configure `.env.local` with Supabase + WhatsApp + Gemini.

## 2) Create a tenant mapping in Supabase

In Supabase SQL Editor run (replace values):

```sql
-- Create org (the key part is whatsapp_phone_number_id)
insert into organizations (name, slug, email, whatsapp_phone_number_id, whatsapp_configured)
values ('Tenant Test', 'tenant-test', 'tenant@test.com', 'TEST_PHONE_NUMBER_ID', true)
returning id;
```

Take the returned `id` and insert a product for better AI responses:

```sql
insert into products (organization_id, name, description, price)
values ('ORG_UUID_HERE', 'Producto Demo', 'Producto de prueba para IA', 99.90);
```

## 3) Send a mock webhook event

```bash
./scripts/test_webhook_local.sh
```

It POSTs `scripts/mock_whatsapp_webhook.json` to:
- `http://localhost:3000/api/whatsapp/webhook`

## 4) Verify results in Supabase

Check the tables:
- `customers` (should include `organization_id = ORG_UUID_HERE`)
- `conversations`
- `messages` (one customer + one agent message)

## Notes
- The webhook resolves tenant using `value.metadata.phone_number_id`.
- In production, `TEST_PHONE_NUMBER_ID` must be the real WhatsApp Cloud API `phone_number_id`.
