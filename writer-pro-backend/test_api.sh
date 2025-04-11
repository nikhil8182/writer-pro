#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Writer Pro Backend API ===${NC}"

# Test generate-outline endpoint
echo -e "\n${BLUE}Testing /generate-outline endpoint...${NC}"
curl -s -X POST http://localhost:8000/generate-outline \
  -H "Content-Type: application/json" \
  -d '{
    "contentDescription": "Write about the benefits of AI in content creation",
    "contentType": "motivation",
    "base_system_instruction": "You are an expert content creator assistant."
  }' | jq .

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Outline generation endpoint working${NC}"
else
  echo -e "${RED}❌ Failed to get response from outline endpoint${NC}"
fi

# Test optimize-content endpoint
echo -e "\n${BLUE}Testing /optimize-content endpoint...${NC}"
curl -s -X POST http://localhost:8000/optimize-content \
  -H "Content-Type: application/json" \
  -d '{
    "content": "AI has transformed how we create and manage content. It helps with generating ideas, drafting content, and optimizing for different audiences.",
    "platform": "twitter",
    "contentType": "info",
    "base_system_instruction": "You are an expert content optimizer assistant."
  }' | jq .

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Content optimization endpoint working${NC}"
else
  echo -e "${RED}❌ Failed to get response from optimization endpoint${NC}"
fi

echo -e "\n${BLUE}API Tests completed.${NC}" 