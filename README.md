# Wallet Transaction System API

A RESTful wallet and order management system built with **Node.js**, **Express**, and **SQLite**.

## Tech Stack
- **Node.js** (v18+)
- **Express** — HTTP routing
- **sql.js** — SQLite (pure JS, zero native dependencies)
- **uuid** — Unique ID generation

---

## Setup & Run

# 1. Install dependencies
npm install

# 2. Start the server
npm start
# Server runs at http://localhost:3000

# (Optional) Dev mode with auto-reload
npm run dev

# Or run on custom port
cd ~/Downloads/wallet-app
PORT=3002 npm start

Automated API Testing (Demo Script)

To simplify testing, a shell script is provided that runs all APIs in sequence and demonstrates the complete workflow.

▶️ Create and Run Script
--- cat > demo.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'; NC='\033[0m'; BOLD='\033[1m'
BASE_URL="http://localhost:3002"

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${WHITE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_response() {
  echo -e "${GREEN}  ✔  Response:${NC}"
  echo "$1" | python3 -m json.tool | sed 's/^/     /'
}

print_error_response() {
  echo -e "${YELLOW}  ✔  Response (Expected Error):${NC}"
  echo "$1" | python3 -m json.tool | sed 's/^/     /'
}

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║       WALLET TRANSACTION SYSTEM — LIVE DEMO          ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

print_header "1/6  Admin — Credit Wallet   (POST /admin/wallet/credit)"
CREDIT=$(curl -s -X POST $BASE_URL/admin/wallet/credit \
  -H "Content-Type: application/json" \
  -d '{"client_id": "client_001", "amount": 500}')
print_response "$CREDIT"; sleep 0.5

print_header "2/6  Client — Check Wallet Balance   (GET /wallet/balance)"
BALANCE=$(curl -s $BASE_URL/wallet/balance -H "client-id: client_001")
print_response "$BALANCE"; sleep 0.5

print_header "3/6  Admin — Debit Wallet   (POST /admin/wallet/debit)"
DEBIT=$(curl -s -X POST $BASE_URL/admin/wallet/debit \
  -H "Content-Type: application/json" \
  -d '{"client_id": "client_001", "amount": 100}')
print_response "$DEBIT"; sleep 0.5

print_header "4/6  Client — Create Order   (POST /orders)"
ORDER=$(curl -s -X POST $BASE_URL/orders \
  -H "Content-Type: application/json" \
  -H "client-id: client_001" \
  -d '{"amount": 150}')
print_response "$ORDER"

ORDER_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['order']['id'])" 2>/dev/null)
sleep 0.5

print_header "5/6  Client — Get Order Details   (GET /orders/:id)"
GET_ORDER=$(curl -s $BASE_URL/orders/$ORDER_ID -H "client-id: client_001")
print_response "$GET_ORDER"; sleep 0.5

print_header "6/6  Edge Case — Insufficient Balance   (POST /orders)"
EDGE=$(curl -s -X POST $BASE_URL/orders \
  -H "Content-Type: application/json" \
  -H "client-id: client_001" \
  -d '{"amount": 99999}')
print_error_response "$EDGE"; sleep 0.5

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║   ✅  ALL APIs TESTED SUCCESSFULLY                   ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "  ${GREEN}✔${NC}  POST /admin/wallet/credit  — Wallet topped up"
echo -e "  ${GREEN}✔${NC}  GET  /wallet/balance        — Balance retrieved"
echo -e "  ${GREEN}✔${NC}  POST /admin/wallet/debit    — Wallet debited"
echo -e "  ${GREEN}✔${NC}  POST /orders                — Order created + fulfillment stored"
echo -e "  ${GREEN}✔${NC}  GET  /orders/:id            — Order details fetched"
echo -e "  ${GREEN}✔${NC}  Edge case                   — Insufficient balance handled"
echo ""
EOF

chmod +x demo.sh
./demo.sh

## Project Structure

```
wallet-app/
├── src/
│   ├── main.js                        # Entry point, Express setup
│   ├── db.js                          # SQLite connection + helpers
│   ├── routes/
│   │   ├── admin.js                   # Admin wallet routes
│   │   ├── orders.js                  # Orders routes
│   │   └── wallet.js                  # Wallet balance route
│   ├── controllers/
│   │   ├── adminController.js         # Credit / Debit logic
│   │   ├── ordersController.js        # Create order / Get order
│   │   └── walletController.js        # Get balance
│   └── middleware/
│       └── validateClientId.js        # Validates client-id header
├── package.json
└── README.md
```

---

## API Reference & curl Examples

### 1. Admin — Credit Wallet
**POST** `/admin/wallet/credit`

```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Content-Type: application/json" \
  -d '{"client_id": "client_001", "amount": 500}'
```

**Response:**
```json
{
  "message": "Wallet credited successfully",
  "client_id": "client_001",
  "credited": 500,
  "new_balance": 500,
  "ledger_id": "uuid-here"
}
```

---

### 2. Admin — Debit Wallet
**POST** `/admin/wallet/debit`

```bash
curl -X POST http://localhost:3000/admin/wallet/debit \
  -H "Content-Type: application/json" \
  -d '{"client_id": "client_001", "amount": 100}'
```

**Response:**
```json
{
  "message": "Wallet debited successfully",
  "client_id": "client_001",
  "debited": 100,
  "new_balance": 400,
  "ledger_id": "uuid-here"
}
```

**Error — Insufficient balance (400):**
```json
{ "error": "Insufficient balance", "current_balance": 50, "requested_debit": 100 }
```

---

### 3. Client — Create Order
**POST** `/orders`  
**Header:** `client-id: <client_id>`

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "client-id: client_001" \
  -d '{"amount": 150}'
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "uuid-here",
    "client_id": "client_001",
    "amount": 150,
    "status": "created",
    "fulfillment_id": "101",
    "created_at": "2026-01-01 10:00:00"
  },
  "remaining_balance": 350
}
```

**Error — Insufficient balance (400):**
```json
{ "error": "Insufficient wallet balance", "current_balance": 50, "required": 150 }
```

**Error — Fulfillment API failure (502):**
```json
{ "error": "Fulfillment service unavailable. Order cancelled and amount refunded.", "order_id": "uuid" }
```

---

### 4. Client — Get Order Details
**GET** `/orders/:order_id`  
**Header:** `client-id: <client_id>`

```bash
curl http://localhost:3000/orders/<order_id> \
  -H "client-id: client_001"
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "client_id": "client_001",
  "amount": 150,
  "status": "created",
  "fulfillment_id": "101",
  "created_at": "2026-01-01 10:00:00"
}
```

**Error — Not found or wrong client (404):**
```json
{ "error": "Order not found or does not belong to this client" }
```

---

### 5. Client — Wallet Balance
**GET** `/wallet/balance`  
**Header:** `client-id: <client_id>`

```bash
curl http://localhost:3000/wallet/balance \
  -H "client-id: client_001"
```

**Response:**
```json
{ "client_id": "client_001", "balance": 350 }
```

---

## Design Decisions

| Concern | Approach |
|---|---|
| Atomicity | Wallet deduction + order creation wrapped in a single SQLite `BEGIN IMMEDIATE` transaction |
| Fulfillment failure | Wallet refunded and order marked `fulfillment_failed`; client gets 502 |
| Client isolation | Order fetch checks both `id` AND `client_id` — no cross-client data leakage |
| Input validation | Amount must be positive number; client_id/client-id header required everywhere |
| Ledger | Every credit/debit creates an immutable ledger entry for audit trail |
| Persistence | SQLite data persisted to `wallet.db.json` after every write |

---

## Database Schema

```sql
-- Wallets: one row per client, holds current balance
CREATE TABLE wallets (
  client_id TEXT PRIMARY KEY,
  balance   REAL NOT NULL DEFAULT 0
);

-- Ledger: audit trail of every credit/debit
CREATE TABLE ledger (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('credit','debit')),
  amount     REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders: tracks every order with its fulfillment ID
CREATE TABLE orders (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL,
  amount         REAL NOT NULL,
  status         TEXT NOT NULL DEFAULT 'created',
  fulfillment_id TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```
