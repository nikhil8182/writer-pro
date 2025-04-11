import httpx
import json
from fastapi import HTTPException
import config

# --- Helper Function to Extract Text from OpenAI Response --- -
def extract_text_from_output(output_data):
    """Helper function to extract text from various output formats"""
    print(f"[OPENAI] Output type: {type(output_data).__name__}")

    # If output_data is a string, return it directly
    if isinstance(output_data, str):
        print("[OPENAI] Output is a string, returning directly")
        return output_data

    # Case 1: Output is a list (various possible structures)
    if isinstance(output_data, list):
        print(f"[OPENAI] Processing list output with {len(output_data)} items")

        # Try to find any message type items and extract text content
        for item in output_data:
            if not isinstance(item, dict):
                continue

            # Print safely without using the item as a key
            item_type = item.get('type', 'unknown')
            print(f"[OPENAI] Examining list item type: {item_type}")

            # Special case for web_search_call type
            if item_type == "web_search_call":
                print("[OPENAI] Found web_search_call, looking for results...")
                # Web search calls might have results we need to extract
                if item.get("web_search_results") and isinstance(item["web_search_results"], list):
                    search_text = []
                    for result in item["web_search_results"]:
                        if isinstance(result, dict) and result.get("text"):
                            search_text.append(result["text"])
                    if search_text:
                        combined = "\n\n".join(search_text)
                        print(f"[OPENAI] Found text in web search results, length: {len(combined)}")
                        return combined

            # Case 1.1: Item is a message with content
            if item_type == "message":
                print("[OPENAI] Found message type item")

                # Check if content exists and is a list
                if isinstance(item.get("content"), list) and len(item["content"]) > 0:
                    for content_item in item["content"]:
                        if isinstance(content_item, dict) and content_item.get("type") == "output_text":
                            text = content_item.get("text")
                            if text:
                                print("[OPENAI] Found text in message content")
                                return text
                        elif isinstance(content_item, dict) and content_item.get("text"):
                            print("[OPENAI] Found text directly in content item")
                            return content_item.get("text")

                # Case 1.2: Item has direct text field
                if item.get("text"):
                    print("[OPENAI] Found text directly in message item")
                    return item.get("text")

                # Case 1.3: Item might have content as a string
                if isinstance(item.get("content"), str):
                    print("[OPENAI] Found content as string in message item")
                    return item.get("content")

        # If we've gone through all items but found nothing, check first item
        if len(output_data) > 0 and isinstance(output_data[0], dict):
            first_item = output_data[0]

            # Simple case - first item has text
            if first_item.get("text"):
                print("[OPENAI] Found text in first list item")
                return first_item.get("text")

    # Case 2: Output is a dictionary
    elif isinstance(output_data, dict):
        # Print keys safely to avoid serialization errors
        try:
            key_list = list(output_data.keys())
            print(f"[OPENAI] Processing dictionary output with keys: {key_list}")
        except Exception as e:
            print(f"[OPENAI] Error listing dictionary keys: {e}")

        # Case 2.1: Direct text field
        if output_data.get("text"):
            print("[OPENAI] Found text directly in dictionary")
            return output_data.get("text")

        # Case 2.2: Message field
        if output_data.get("message") and isinstance(output_data["message"], dict):
            message = output_data["message"]

            # Check for content in message
            if isinstance(message.get("content"), str):
                print("[OPENAI] Found content in message field")
                return message.get("content")

            # Check for text in message
            if message.get("text"):
                print("[OPENAI] Found text in message field")
                return message.get("text")

        # Case 2.3: Content field with text
        if output_data.get("content"):
            if isinstance(output_data["content"], str):
                print("[OPENAI] Found content field as string")
                return output_data["content"]

    # If we've tried everything and found nothing
    return None

# --- Helper Function to Call OpenAI --- -
async def call_openai_api(user_prompt: str, config_page_instruction: str, custom_instruction: str | None, request_type: str = "outline"):
    print(f"[OPENAI] Starting API call with prompt: {user_prompt[:100]}... (truncated)")

    if not config.OPENAI_API_KEY or config.OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
        print("[ERROR] OpenAI API key not configured")
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on the server.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.OPENAI_API_KEY}",
    }
    print("[OPENAI] Headers prepared")

    # Just use the ConfigPage instruction directly, no extra words
    instruction = config_page_instruction
    print(f"[OPENAI] Using instruction: {instruction[:150]}... (truncated)")

    # Set model based on request type
    model = config.MODELS.get(request_type, config.MODELS["outline"])
    print("............................................................")
    print(f"[OPENAI] Using model: {model} for {request_type} request")
    print("............................................................")

    # Create a simpler request body structure that works with current API
    request_body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": instruction
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "temperature": 1.0,
        "max_tokens": 2048,
        "top_p": 1.0
    }

    print("[OPENAI] Request body created")

    # Print summarized version of request for debugging
    print(f"[OPENAI] Request summary: model={model}, max_tokens={request_body['max_tokens']}")

    async with httpx.AsyncClient(timeout=60.0) as client: # Increased timeout
        try:
            print("[OPENAI] Sending request to OpenAI API...")
            response = await client.post(config.OPENAI_API_URL, headers=headers, json=request_body)
            print(f"[OPENAI] Response received: status={response.status_code}")

            response.raise_for_status()  # Raise exception for bad status codes (4xx or 5xx)
            data = response.json()
            print("[OPENAI] Response parsed as JSON")

            # Extract text from response using simpler ChatGPT API structure
            print("[OPENAI] Extracting text from response...")
            
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0].get("message", {}).get("content", "")
                if content:
                    print(f"[OPENAI] Successfully extracted text, length: {len(content)}")
                    return content
                    
            # Fallback to more complex parsing if needed
            output_content = extract_text_from_output(data)
            
            if output_content:
                print(f"[OPENAI] Successfully extracted text using fallback, length: {len(output_content)}")
                return output_content
            else:
                # If we couldn't find any text in the response
                print("[ERROR] Failed to extract text from response")
                try:
                    response_str = json.dumps(data, default=str)[:500] # Convert to JSON safely
                    print(f"[ERROR] Response structure: {response_str}... (truncated)")
                except Exception as e:
                    print(f"[ERROR] Could not serialize response data: {e}")
                
                raise HTTPException(status_code=500, detail="Failed to parse content from OpenAI API response.")

        except httpx.HTTPStatusError as e:
            print(f"[ERROR] HTTP status error: {e.response.status_code}")
            try:
                error_detail = e.response.json()
                print(f"[ERROR] OpenAI error details: {error_detail}")
                detail = error_detail.get("error", {}).get("message", f"OpenAI API error: {e.response.status_code}")
            except Exception:
                print(f"[ERROR] Could not parse error response: {e.response.text}")
                detail = f"OpenAI API error: {e.response.status_code} - {e.response.text}"
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError as e:
            print(f"[ERROR] Request error: {e}")
            raise HTTPException(status_code=503, detail=f"Could not connect to OpenAI API: {e}")
        except Exception as e:
            print(f"[ERROR] Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="An internal server error occurred.") 