import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# CORS Configuration
# Read origins from environment variable, split by comma, strip whitespace
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://writer-pro-front-end.onrender.com")
CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",")]

# OpenAI API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Model Configuration
MODELS = {
    "outline": "gpt-4o-search-preview",
    "optimize": "gpt-4.5-preview",
    "rewrite": "gpt-4.5-preview",
    "reply": "gpt-4.5-preview"
}

# Platform character limits
PLATFORM_LIMITS = {
    "twitter": 280,
    "linkedin": 3000,
    "instagram": 2200,
    "blog": 10000,
    "default": 5000
} 