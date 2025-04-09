import os
import httpx
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
print("[STARTUP] Writer Pro Backend starting...")
print(f"[STARTUP] OpenAI API Key present: {bool(os.getenv('OPENAI_API_KEY'))}")

app = FastAPI()

# --- CORS Configuration --- - Allow requests from React frontend
origins = [
    "http://localhost:3000",  # Default React dev server port
    "http://127.0.0.1:3000",
    # Add any other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
print(f"[STARTUP] CORS configured for origins: {origins}")

# --- Pydantic Models for Request Bodies ---
class OutlineRequest(BaseModel):
    contentDescription: str
    contentType: str | None = None
    customSystemInstruction: str | None = None  # Legacy parameter, kept for compatibility
    base_system_instruction: str  # Primary instruction from ConfigPage

class OptimizeRequest(BaseModel):
    content: str
    platform: str
    contentType: str | None = None # Keep consistent with frontend
    customSystemInstruction: str | None = None  # Legacy parameter, kept for compatibility
    base_system_instruction: str  # Primary instruction from ConfigPage

# --- OpenAI API Configuration --- -
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/responses"

# --- Helper Function to Call OpenAI --- -
async def call_openai_api(user_prompt: str, config_page_instruction: str, custom_instruction: str | None):
    print(f"[OPENAI] Starting API call with prompt: {user_prompt[:100]}... (truncated)")
    
    if not OPENAI_API_KEY or OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
        print("[ERROR] OpenAI API key not configured")
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on the server.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }
    print("[OPENAI] Headers prepared")

    # Just use the ConfigPage instruction directly, no extra words
    instruction = config_page_instruction
    print(f"[OPENAI] Using instruction: {instruction[:150]}... (truncated)")
    
    # Ignore the custom_instruction parameter entirely as requested

    request_body = {
        "model": "gpt-4o",
        "input": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "input_text",
                        "text": instruction
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": user_prompt
                    }
                ]
            }
        ],
        "text": {
            "format": {
                "type": "text"
            }
        },
        "reasoning": {},
        "tools": [
            {
                "type": "web_search_preview",
                "user_location": {
                    "type": "approximate"
                },
                "search_context_size": "medium"
            }
        ],
        "temperature": 1,
        "max_output_tokens": 2048,
        "top_p": 1,
        "store": True
    }
    print("[OPENAI] Request body created")
    
    # Print summarized version of request for debugging
    print(f"[OPENAI] Request summary: model={request_body['model']}, max_tokens={request_body['max_output_tokens']}")

    async with httpx.AsyncClient(timeout=60.0) as client: # Increased timeout
        try:
            print("[OPENAI] Sending request to OpenAI API...")
            response = await client.post(OPENAI_API_URL, headers=headers, json=request_body)
            print(f"[OPENAI] Response received: status={response.status_code}")
            
            response.raise_for_status()  # Raise exception for bad status codes (4xx or 5xx)
            data = response.json()
            print("[OPENAI] Response parsed as JSON")

            # Extract text from response
            print("[OPENAI] Extracting text from response...")
            output_content = None
            if data and data.get("output"):
                output_data = data["output"]
                print(f"[OPENAI] Output type: {type(output_data).__name__}")
                
                # Case 1: Output is a list (potentially with nested message structure)
                if isinstance(output_data, list) and len(output_data) > 0:
                    print(f"[OPENAI] Processing list output with {len(output_data)} items")
                    first_output_item = output_data[0]
                    if isinstance(first_output_item, dict):
                        print(f"[OPENAI] First output item keys: {list(first_output_item.keys())}")
                        # Check for nested content structure: output[0]['content'][0]['text']
                        if (first_output_item.get("type") == "message" and
                            isinstance(first_output_item.get("content"), list) and
                            len(first_output_item["content"]) > 0 and
                            isinstance(first_output_item["content"][0], dict) and
                            first_output_item["content"][0].get("type") == "output_text"):
                            print("[OPENAI] Found text in nested content structure")
                            output_content = first_output_item["content"][0].get("text")
                        # Check if the first item itself has text (simpler list case)
                        elif first_output_item.get("text"):
                            print("[OPENAI] Found text directly in first output item")
                            output_content = first_output_item["text"]
                # Case 2: Output is a dictionary
                elif isinstance(output_data, dict) and output_data.get("text"):
                    print("[OPENAI] Found text in dictionary output")
                    output_content = output_data["text"]

            if output_content:
                print(f"[OPENAI] Successfully extracted text, length: {len(output_content)}")
                print(f"[OPENAI] Text preview: {output_content[:100]}... (truncated)")
                return output_content
            else:
                print("[ERROR] Failed to extract text from response")
                print(f"[ERROR] Response structure: {json.dumps(data)[:500]} (truncated)")
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

# --- FastAPI Endpoints --- -

@app.post("/generate-outline")
async def generate_outline_endpoint(request: OutlineRequest):
    print("=" * 50)
    print(f"[ENDPOINT] generate-outline called with content type: {request.contentType}")
    print(f"[ENDPOINT] Description: {request.contentDescription[:100]}... (truncated)")
    
    # Log the ConfigPage instruction length only
    config_instruction_length = len(request.base_system_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")
    
   
    user_prompt = request.contentDescription
    
    print(f"[ENDPOINT] Created user prompt: {user_prompt}")

    # Call OpenAI API - passing null for custom_instruction
    print("[ENDPOINT] Calling OpenAI API...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,  # ConfigPage instruction
        None  # Ignore custom instruction
    )
    print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters")
    print("[ENDPOINT] Returning outline to frontend")
    return {"outline": generated_text}


@app.post("/optimize-content")
async def optimize_content_endpoint(request: OptimizeRequest):
    print("=" * 50)
    print(f"[ENDPOINT] optimize-content called for platform: {request.platform}")
    print(f"[ENDPOINT] Content length: {len(request.content)} characters")
    
    # Log the ConfigPage instruction length only
    config_instruction_length = len(request.base_system_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")
    
    # Get platform character limits
    platform_limits = {
        "twitter": 280,
        "linkedin": 3000,
        "instagram": 2200,
        "blog": 10000,
        "default": 5000
    }
    character_limit = platform_limits.get(request.platform, platform_limits["default"])
    print(f"[ENDPOINT] Platform character limit: {character_limit}")
    
    # Create user prompt
    user_prompt = f"Optimize the following content for the '{request.platform}' platform. Aim for a character limit of {character_limit}.\n\nOriginal Content:\n\"{request.content}\""
    print(f"[ENDPOINT] Created user prompt: {user_prompt[:100]}... (truncated)")

    # Call OpenAI API - passing null for custom_instruction
    print("[ENDPOINT] Calling OpenAI API...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,  # ConfigPage instruction
        None  # Ignore custom instruction
    )
    print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters")
    print("[ENDPOINT] Returning optimized content to frontend")
    return {"optimizedContent": generated_text}


@app.get("/")
async def read_root():
    print("[ENDPOINT] root endpoint called (health check)")
    return {"message": "Writer Pro Backend is running."}

# Print startup message
print("[STARTUP] FastAPI application ready to accept requests")
print("-" * 50)

# --- Run Command (for reference) --- -
# uvicorn main:app --reload --port 8000 