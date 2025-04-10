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