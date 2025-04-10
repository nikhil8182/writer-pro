from fastapi import APIRouter, HTTPException
import models
from services.openai import call_openai_api
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