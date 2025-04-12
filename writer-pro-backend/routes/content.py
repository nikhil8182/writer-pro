from fastapi import APIRouter, HTTPException
import models
from services.openai import call_openai_api, generate_reply
import config

router = APIRouter()

@router.post("/generate-outline")
async def generate_outline_endpoint(request: models.OutlineRequest):
    print(f"[ROUTE] /generate-outline - Type: {request.contentType}, DescLen: {len(request.contentDescription)}, InstrLen: {len(request.base_system_instruction)}")

    user_prompt = request.contentDescription

    print("[ROUTE] Calling OpenAI service for outline...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "outline"
    )
    print(f"[ROUTE] OpenAI service returned {len(generated_text)} characters")
    return {"outline": generated_text}

@router.post("/optimize-content")
async def optimize_content_endpoint(request: models.OptimizeRequest):
    print(f"[ROUTE] /optimize-content - Platform: {request.platform}, ContentLen: {len(request.content)}, InstrLen: {len(request.base_system_instruction)}")

    character_limit = config.PLATFORM_LIMITS.get(request.platform, config.PLATFORM_LIMITS["default"])
    print(f"[ROUTE] Platform character limit: {character_limit}")

    user_prompt = f"Optimize the following content for the '{request.platform}' platform. Aim for a character limit of {character_limit}.\n\nOriginal Content:\n\"{request.content}\""

    print("[ROUTE] Calling OpenAI service for optimization...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "optimize"
    )
    print(f"[ROUTE] OpenAI service returned {len(generated_text)} characters")
    return {"optimizedContent": generated_text}

@router.post("/rewrite-content")
async def rewrite_content_endpoint(request: models.RewriteRequest):
    print(f"[ROUTE] /rewrite-content - Style: {request.style}, ContentLen: {len(request.content)}, InstrLen: {len(request.base_system_instruction)}")

    user_prompt = f"Rewrite the following content in a {request.style} style while maintaining the core meaning:\n\nOriginal Content:\n\"{request.content}\""

    print("[ROUTE] Calling OpenAI service for rewrite...")
    generated_text = await call_openai_api(
        user_prompt,
        request.base_system_instruction,
        None,
        "rewrite"
    )
    print(f"[ROUTE] OpenAI service returned {len(generated_text)} characters")
    return {"rewrittenContent": generated_text}

@router.post("/generate-reply")
async def generate_reply_endpoint(request: models.ReplyRequest):
    """Endpoint to generate a reply to a comment."""
    print(f"[ROUTE] /generate-reply - Tone: {request.tone}, CommentLen: {len(request.comment)}, InstrLen: {len(request.base_system_instruction)}")

    base_instruction = request.base_system_instruction or "You are a helpful assistant replying to comments."

    print("[ROUTE] Calling generate_reply service...")
    try:
        generated_text = await generate_reply(
            comment=request.comment,
            tone=request.tone,
            base_system_instruction=base_instruction
        )
        print(f"[ROUTE] OpenAI service returned {len(generated_text)} characters for reply")
        return {"reply": generated_text}
    except HTTPException as e:
        # Re-raise HTTPException to let FastAPI handle it
        raise e
    except Exception as e:
        print(f"[ERROR] Unexpected error in /generate-reply endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply due to an internal error.") 