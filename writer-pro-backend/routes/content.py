from fastapi import APIRouter, HTTPException
import models
from services.openai import call_openai_api, generate_reply
import config

router = APIRouter()

@router.post("/generate-outline")
async def generate_outline_endpoint(request: models.OutlineRequest):
    print("=" * 50)
    print(f"[ENDPOINT] generate-outline called with content type: {request.contentType}")
    print(f"[ENDPOINT] Description: {request.contentDescription[:100]}... (truncated)")

    config_instruction_length = len(request.base_system_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")

    user_prompt = request.contentDescription
    print(f"[ENDPOINT] Created user prompt: {user_prompt[:100]}... (truncated)")

    print("[ENDPOINT] Calling OpenAI API...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "outline"
    )
    print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters")
    print("[ENDPOINT] Returning outline to frontend")
    return {"outline": generated_text}

@router.post("/optimize-content")
async def optimize_content_endpoint(request: models.OptimizeRequest):
    print("=" * 50)
    print(f"[ENDPOINT] optimize-content called for platform: {request.platform}")
    print(f"[ENDPOINT] Content length: {len(request.content)} characters")

    config_instruction_length = len(request.base_system_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")

    character_limit = config.PLATFORM_LIMITS.get(request.platform, config.PLATFORM_LIMITS["default"])
    print(f"[ENDPOINT] Platform character limit: {character_limit}")

    user_prompt = f"Optimize the following content for the '{request.platform}' platform. Aim for a character limit of {character_limit}.\n\nOriginal Content:\n\"{request.content}\""
    print(f"[ENDPOINT] Created user prompt: {user_prompt[:100]}... (truncated)")

    print("[ENDPOINT] Calling OpenAI API...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "optimize"
    )
    print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters")
    print("[ENDPOINT] Returning optimized content to frontend")
    return {"optimizedContent": generated_text}

@router.post("/rewrite-content")
async def rewrite_content_endpoint(request: models.RewriteRequest):
    print("=" * 50)
    print(f"[ENDPOINT] rewrite-content called with style: {request.style}")
    print(f"[ENDPOINT] Content length: {len(request.content)} characters")

    config_instruction_length = len(request.base_system_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")

    user_prompt = f"Rewrite the following content in a {request.style} style while maintaining the core meaning:\n\nOriginal Content:\n\"{request.content}\""
    print(f"[ENDPOINT] Created user prompt: {user_prompt[:100]}... (truncated)")

    print("[ENDPOINT] Calling OpenAI API...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "rewrite"
    )
    print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters")
    print("[ENDPOINT] Returning rewritten content to frontend")
    return {"rewrittenContent": generated_text}

@router.post("/generate-reply")
async def generate_reply_endpoint(request: models.ReplyRequest):
    """Endpoint to generate a reply to a comment."""
    print("=" * 50)
    print(f"[ENDPOINT] generate-reply called for tone: {request.tone}")
    print(f"[ENDPOINT] Comment length: {len(request.comment)} characters")

    # For reply, we might want a specific default instruction if none provided
    # or rely on the one in the service function
    base_instruction = request.base_system_instruction or "You are a helpful assistant replying to comments."
    config_instruction_length = len(base_instruction)
    print(f"[ENDPOINT] ConfigPage instruction length: {config_instruction_length}")
    
    print("[ENDPOINT] Calling generate_reply service...")
    try:
        generated_text = await generate_reply(
            comment=request.comment,
            tone=request.tone,
            base_system_instruction=base_instruction
        )
        print(f"[ENDPOINT] OpenAI API returned {len(generated_text)} characters for reply")
        print("[ENDPOINT] Returning generated reply to frontend")
        return {"reply": generated_text}
    except HTTPException as e:
        # Re-raise HTTPException to let FastAPI handle it
        raise e
    except Exception as e:
        print(f"[ERROR] Unexpected error in generate_reply_endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply due to an internal error.") 