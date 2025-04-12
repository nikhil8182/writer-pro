from pydantic import BaseModel

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

class RewriteRequest(BaseModel):
    content: str
    style: str # Style of rewriting (professional, casual, etc.)
    base_system_instruction: str  # Primary instruction from ConfigPage

class ReplyRequest(BaseModel):
    comment: str # The comment text to reply to
    tone: str # Desired tone for the reply (e.g., helpful, appreciative)
    base_system_instruction: str | None = None # Optional instruction from ConfigPage 