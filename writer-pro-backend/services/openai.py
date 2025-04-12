import httpx
import json
from fastapi import HTTPException
import config

# --- Helper Function to Extract Text from OpenAI Response --- -
def extract_text_from_output(output_data):
    """Helper function to extract text from various output formats"""
    # Minimal print: only log the type and length if it's a list/dict
    output_type = type(output_data).__name__
    if isinstance(output_data, (list, dict)):
        print(f"[OPENAI_PARSE] Input type: {output_type}, Size: {len(output_data)}")
    else:
        print(f"[OPENAI_PARSE] Input type: {output_type}")

    # If output_data is a string, return it directly
    if isinstance(output_data, str):
        return output_data

    # Case 1: Output is a list (various possible structures)
    if isinstance(output_data, list):
        # Try to find any message type items and extract text content
        for item in output_data:
            if not isinstance(item, dict):
                continue

            # Print safely without using the item as a key
            item_type = item.get('type', 'unknown')

            # Special case for web_search_call type
            if item_type == "web_search_call":
                # Web search calls might have results we need to extract
                if item.get("web_search_results") and isinstance(item["web_search_results"], list):
                    search_text = []
                    for result in item["web_search_results"]:
                        if isinstance(result, dict) and result.get("text"):
                            search_text.append(result["text"])
                    if search_text:
                        combined = "\n\n".join(search_text)
                        print(f"[OPENAI_PARSE] Extracted text from web search, length: {len(combined)}")
                        return combined

            # Case 1.1: Item is a message with content
            if item_type == "message":
                # Check if content exists and is a list
                if isinstance(item.get("content"), list) and len(item["content"]) > 0:
                    for content_item in item["content"]:
                        if isinstance(content_item, dict) and content_item.get("type") == "output_text":
                            text = content_item.get("text")
                            if text:
                                return text
                        elif isinstance(content_item, dict) and content_item.get("text"):
                            return content_item.get("text")

                # Case 1.2: Item has direct text field
                if item.get("text"):
                    return item.get("text")

                # Case 1.3: Item might have content as a string
                if isinstance(item.get("content"), str):
                    return item.get("content")

    # Case 2: Output is a dictionary
    elif isinstance(output_data, dict):
        # Print keys safely to avoid serialization errors
        try:
            key_list = list(output_data.keys())
        except Exception as e:
            print(f"[OPENAI_PARSE] Error listing dictionary keys: {e}")

        # Case 2.1: Direct text field
        if output_data.get("text"):
            return output_data.get("text")

        # Case 2.2: Message field
        if output_data.get("message") and isinstance(output_data["message"], dict):
            message = output_data["message"]

            # Check for content in message
            if isinstance(message.get("content"), str):
                return message.get("content")

            # Check for text in message
            if message.get("text"):
                return message.get("text")

        # Case 2.3: Content field with text
        if output_data.get("content"):
            if isinstance(output_data["content"], str):
                return output_data["content"]

    # If we've tried everything and found nothing
    print("[OPENAI_PARSE] Could not extract text from primary fields")
    return None

# --- Helper Function to Call OpenAI --- -
async def call_openai_api(user_prompt: str, config_page_instruction: str, custom_instruction: str | None, request_type: str = "outline"):
    print(f"[OPENAI_API] Requesting '{request_type}'. Prompt len: {len(user_prompt)}, Instruction len: {len(config_page_instruction)}")

    if not config.OPENAI_API_KEY or config.OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
        print("[ERROR] OpenAI API key not configured")
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on the server.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.OPENAI_API_KEY}",
    }

    # Just use the ConfigPage instruction directly, no extra words
    instruction = config_page_instruction

    # Set model based on request type
    model = config.MODELS.get(request_type, config.MODELS["outline"])

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
        "max_tokens": 2048
    }
    
    # Add model-specific parameters
    if model == "gpt-4o-search-preview":
        # gpt-4o-search-preview doesn't support temperature and top_p
        request_body["response_format"] = {"type": "text"}
        request_body["store"] = False
    else:
        # For other models, include temperature and top_p
        request_body["temperature"] = 1.0
        request_body["top_p"] = 1.0

    # Print summarized version of request for debugging
    print(f"[OPENAI_API] Request params: model={model}, max_tokens={request_body['max_tokens']}")
    
    # Debug the request body for search-enabled models
    if "search" in model:
        print(f"[OPENAI_API] Search model params include: {list(request_body.keys())}")

    async with httpx.AsyncClient(timeout=60.0) as client: # Increased timeout
        try:
            print(f"[OPENAI_API] Sending request to {config.OPENAI_API_URL}...")
            response = await client.post(config.OPENAI_API_URL, headers=headers, json=request_body)
            print(f"[OPENAI_API] Response status: {response.status_code}")

            response.raise_for_status()  # Raise exception for bad status codes (4xx or 5xx)
            data = response.json()

            # Extract text from response using simpler ChatGPT API structure
            print("[OPENAI_API] Attempting to extract text from response...")
            
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0].get("message", {}).get("content", "")
                if content:
                    print(f"[OPENAI_API] Extracted text via 'choices', length: {len(content)}")
                    return content
                    
            # Fallback to more complex parsing if needed
            print("[OPENAI_API] Using fallback extraction logic...")
            output_content = extract_text_from_output(data)
            
            if output_content:
                print(f"[OPENAI_API] Extracted text via fallback, length: {len(output_content)}")
                return output_content
            else:
                # If we couldn't find any text in the response
                print("[ERROR] Failed to extract text from OpenAI response")
                try:
                    # Log only keys and structure summary, not full data
                    response_summary = {k: type(v).__name__ for k, v in data.items()}
                    print(f"[ERROR] Response structure summary: {response_summary}")
                except Exception as e:
                    print(f"[ERROR] Could not summarize response data: {e}")
                
                raise HTTPException(status_code=500, detail="Failed to parse content from OpenAI API response.")

        except httpx.HTTPStatusError as e:
            print(f"[ERROR] HTTP status error: {e.response.status_code}")
            try:
                error_detail = e.response.json()
                # Log only essential error message if available
                error_message = error_detail.get("error", {}).get("message", "No message provided")
                print(f"[ERROR] OpenAI API error detail: {error_message}")
                detail = error_message
            except Exception:
                # Log limited raw text on parsing failure
                error_text = e.response.text[:200] # Limit length
                print(f"[ERROR] Could not parse error response body. Raw start: {error_text}...")
                detail = f"OpenAI API error: {e.response.status_code} - Check logs for details."
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError as e:
            print(f"[ERROR] Request error connecting to OpenAI API: {e}")
            raise HTTPException(status_code=503, detail=f"Could not connect to OpenAI API: {e}")
        except Exception as e:
            print(f"[ERROR] Unexpected error during OpenAI API call: {e}")
            raise HTTPException(status_code=500, detail="An internal server error occurred.")

# --- Service Functions for Specific Tasks --- -

async def generate_outline(content_description: str, content_type: str, base_system_instruction: str):
    print(f"[SERVICE] Generating outline. Desc len: {len(content_description)}, Type: {content_type}")
    prompt = f"Generate a detailed outline for the following content:\nType: {content_type}\nDescription: {content_description}"
    return await call_openai_api(prompt, base_system_instruction, None, "outline")

async def optimize_content(content: str, platform: str, content_type: str, base_system_instruction: str):
    print(f"[SERVICE] Optimizing content. Len: {len(content)}, Platform: {platform}, Type: {content_type}")
    prompt = f"Optimize the following content for the {platform} platform. The original content is for {content_type}.\n\nContent:\n{content}"
    return await call_openai_api(prompt, base_system_instruction, None, "optimize")

async def rewrite_content(content: str, style: str, base_system_instruction: str):
    print(f"[SERVICE] Rewriting content. Len: {len(content)}, Style: {style}")
    prompt = f"Rewrite the following content in a {style} style:\n\nContent:\n{content}"
    return await call_openai_api(prompt, base_system_instruction, None, "rewrite")

async def generate_reply(comment: str, tone: str, base_system_instruction: str):
    """Generates a reply to a given comment in a specified tone."""
    print(f"[SERVICE] Generating reply. Comment len: {len(comment)}, Tone: {tone}")
    prompt = f"Generate a {tone} reply to the following comment:\n\nComment:\n{comment}"
    # Use the base_system_instruction provided from ConfigPage or a default one
    instruction = base_system_instruction or "You are a helpful assistant that generates replies to comments."
    return await call_openai_api(prompt, instruction, None, "reply") 