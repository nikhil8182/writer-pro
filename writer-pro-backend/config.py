import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",  # Default React dev server port
    "http://127.0.0.1:3000",
    # Add any other origins if needed
]

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