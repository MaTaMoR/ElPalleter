#!/bin/bash

# Script de prueba para el Build Webhook Service
# Uso: ./test-webhook.sh [TOKEN]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
WEBHOOK_URL="http://localhost:3002"
TOKEN="${1:-your-secret-token-here}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Build Webhook Service - Test Suite  ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Función auxiliar para hacer peticiones
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4

    echo -e "${YELLOW}→${NC} ${method} ${WEBHOOK_URL}${endpoint}"

    if [ -n "$auth" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X ${method} "${WEBHOOK_URL}${endpoint}" \
                -H "Authorization: Bearer ${TOKEN}" \
                -H "Content-Type: application/json" \
                -d "${data}")
        else
            response=$(curl -s -w "\n%{http_code}" -X ${method} "${WEBHOOK_URL}${endpoint}" \
                -H "Authorization: Bearer ${TOKEN}")
        fi
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${WEBHOOK_URL}${endpoint}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} Status: ${http_code}"
    else
        echo -e "${RED}✗${NC} Status: ${http_code}"
    fi

    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Test 1: Health Check
echo -e "${BLUE}[Test 1]${NC} Health Check (sin autenticación)"
make_request "GET" "/health" "" ""

# Test 2: Build Status (con autenticación)
echo -e "${BLUE}[Test 2]${NC} Consultar estado del build"
make_request "GET" "/build/status" "" "auth"

# Test 3: Rebuild sin token (debe fallar)
echo -e "${BLUE}[Test 3]${NC} Rebuild sin token (debe retornar 401)"
response=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}/rebuild" \
    -H "Content-Type: application/json" \
    -d '{"buildAstro": true, "buildAdmin": true, "async": false}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} Status: ${http_code} (correcto - no autorizado)"
else
    echo -e "${RED}✗${NC} Status: ${http_code} (esperado: 401)"
fi
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

# Test 4: Rebuild asíncrono (modo recomendado)
echo -e "${BLUE}[Test 4]${NC} Rebuild asíncrono (recomendado para producción)"
make_request "POST" "/rebuild" \
    '{"buildAstro": true, "buildAdmin": true, "async": true}' \
    "auth"

# Preguntar si continuar con test síncrono
echo -e "${YELLOW}[Test 5]${NC} Rebuild síncrono - ADVERTENCIA: Esto puede tardar 30-60 segundos"
read -p "¿Deseas ejecutar el test síncrono? (s/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}[Test 5]${NC} Rebuild síncrono (espera a que termine)"
    echo -e "${YELLOW}⏳${NC} Esperando... (puede tardar hasta 60 segundos)"
    make_request "POST" "/rebuild" \
        '{"buildAstro": true, "buildAdmin": true, "async": false}' \
        "auth"
else
    echo -e "${YELLOW}⊗${NC} Test síncrono omitido"
    echo ""
fi

# Test 6: Consultar estado final
echo -e "${BLUE}[Test 6]${NC} Consultar estado final"
make_request "GET" "/build/status" "" "auth"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Tests completados ✓           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "💡 ${BLUE}Tip:${NC} Usa el modo asíncrono en producción para no bloquear peticiones"
echo -e "💡 ${BLUE}Tip:${NC} Consulta los logs del servidor en la terminal donde ejecutaste 'npm run dev'"
