#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:3000/api/whatsapp/webhook}"

curl -sS -X POST "$URL" \
  -H 'Content-Type: application/json' \
  --data @scripts/mock_whatsapp_webhook.json \
  -i
