#!/bin/bash

# Load API key from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Loaded API key from .env file"
else
  echo "Error: .env file not found"
  exit 1
fi

# Check if API key is loaded
if [ -z "$REACT_APP_OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY not found in .env file"
  exit 1
fi

echo "Making request to OpenAI API..."

# Make the API request
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REACT_APP_OPENAI_API_KEY" \
  -d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "As a content writer, produce well-researched and engaging written content on a given topic. Use web search to enhance the content'\''s accuracy and depth when necessary, and ensure the output is informative, concise, and free of any additional commentary or instructions."
    },
    {
      "role": "user",
      "content": "Write a post about sustainable fashion trends for 2024"
    }
  ],
  "temperature": 1,
  "max_tokens": 2048,
  "top_p": 1
}'

echo ""
echo "Request completed" 