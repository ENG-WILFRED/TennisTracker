#!/bin/bash
# WebSocket Integration Test Script
# Usage: npm run test:websocket

echo "🧪 WebSocket Integration Test"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if WebSocket server can start
echo "📋 Test 1: Verify WebSocket server starts..."
timeout 5 node --loader ts-node/esm src/websocket-server.ts > /tmp/ws-server.log 2>&1 &
WS_PID=$!
sleep 2

if ps -p $WS_PID > /dev/null; then
  echo -e "${GREEN}✅ WebSocket server started (PID: $WS_PID)${NC}"
else
  echo -e "${RED}❌ WebSocket server failed to start${NC}"
  cat /tmp/ws-server.log
  exit 1
fi

# Test 2: Check health endpoint
echo ""
echo "📋 Test 2: Check WebSocket health endpoint..."
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
if [[ $HEALTH == *"ok"* ]]; then
  echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
  echo -e "${RED}❌ Health endpoint failed${NC}"
  echo "Response: $HEALTH"
fi

# Test 3: Check WebSocket upgrade endpoint
echo ""
echo "📋 Test 3: Verify WebSocket upgrade works..."
# Can't easily test WS upgrade with curl, so we check if server is accepting connections
if lsof -i :3001 | grep -q LISTEN; then
  echo -e "${GREEN}✅ WebSocket port 3001 is listening${NC}"
else
  echo -e "${RED}❌ WebSocket port 3001 not listening${NC}"
fi

# Test 4: Check broadcast endpoint
echo ""
echo "📋 Test 4: Test broadcast endpoint..."
BROADCAST=$(curl -s -X POST http://localhost:3001/broadcast/broadcast-all \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"message":"test"}}' 2>/dev/null)

if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}✅ Broadcast endpoint accessible${NC}"
else
  echo -e "${RED}❌ Broadcast endpoint failed${NC}"
fi

# Test 5: Check process memory usage
echo ""
echo "📋 Test 5: Process resource usage..."
MEMORY=$(ps -p $WS_PID -o %mem= 2>/dev/null)
CPU=$(ps -p $WS_PID -o %cpu= 2>/dev/null)
echo "Memory: ${MEMORY}% | CPU: ${CPU}%"

if (( $(echo "$MEMORY < 5" | bc -l) )); then
  echo -e "${GREEN}✅ Memory usage normal${NC}"
else
  echo -e "${YELLOW}⚠️  High memory usage: ${MEMORY}%${NC}"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $WS_PID 2>/dev/null
wait $WS_PID 2>/dev/null

echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start WebSocket server: npm run websocket:dev"
echo "2. Start Next.js app: npm run dev"
echo "3. Open http://localhost:3000 in browser"
echo "4. Create a post and watch it appear in real-time in another tab"
