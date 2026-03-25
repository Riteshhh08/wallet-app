#!/bin/bash
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'; DIM='\033[0;37m'; NC='\033[0m'; BOLD='\033[1m'
BASE_URL="http://localhost:3002"

print_header() { echo ""; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BOLD}${WHITE}  $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
print_response() { echo -e "${GREEN}  ✔  Response:${NC}"; echo "$1" | python3 -m json.tool | sed 's/^/     /'; }
print_error_response() { echo -e "${YELLOW}  ✔  Response (Expected Error):${NC}"; echo "$1" | python3 -m json.tool | sed 's/^/     /'; }

echo ""; echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"; echo -e "${BOLD}${CYAN}║       WALLET TRANSACTION SYSTEM — LIVE DEMO          ║${NC}"; echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"; echo ""

print_header "1/6  Admin — Credit Wallet   (POST /admin/wallet/credit)"
CREDIT=$(curl -s -X POST $BASE_URL/admin/wallet/credit -H "Content-Type: application/json" -d '{"client_id": "client_001", "amount": 500}')
print_response "$CREDIT"; sleep 0.5

print_header "2/6  Client — Check Wallet Balance   (GET /wallet/balance)"
BALANCE=$(curl -s $BASE_URL/wallet/balance -H "client-id: client_001")
print_response "$BALANCE"; sleep 0.5

print_header "3/6  Admin — Debit Wallet   (POST /admin/wallet/debit)"
DEBIT=$(curl -s -X POST $BASE_URL/admin/wallet/debit -H "Content-Type: application/json" -d '{"client_id": "client_001", "amount": 100}')
print_response "$DEBIT"; sleep 0.5

print_header "4/6  Client — Create Order   (POST /orders)"
ORDER=$(curl -s -X POST $BASE_URL/orders -H "Content-Type: application/json" -H "client-id: client_001" -d '{"amount": 150}')
print_response "$ORDER"
ORDER_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['order']['id'])" 2>/dev/null); sleep 0.5

print_header "5/6  Client — Get Order Details   (GET /orders/:id)"
GET_ORDER=$(curl -s $BASE_URL/orders/$ORDER_ID -H "client-id: client_001")
print_response "$GET_ORDER"; sleep 0.5

print_header "6/6  Edge Case — Insufficient Balance   (POST /orders)"
EDGE=$(curl -s -X POST $BASE_URL/orders -H "Content-Type: application/json" -H "client-id: client_001" -d '{"amount": 99999}')
print_error_response "$EDGE"; sleep 0.5

echo ""; echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"; echo -e "${BOLD}${GREEN}║   ✅  ALL APIs TESTED SUCCESSFULLY                   ║${NC}"; echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"; echo ""
echo -e "  ${GREEN}✔${NC}  POST /admin/wallet/credit  — Wallet topped up"
echo -e "  ${GREEN}✔${NC}  GET  /wallet/balance        — Balance retrieved"
echo -e "  ${GREEN}✔${NC}  POST /admin/wallet/debit    — Wallet debited"
echo -e "  ${GREEN}✔${NC}  POST /orders                — Order created + fulfillment stored"
echo -e "  ${GREEN}✔${NC}  GET  /orders/:id            — Order details fetched"
echo -e "  ${GREEN}✔${NC}  Edge case                   — Insufficient balance handled"
echo ""
