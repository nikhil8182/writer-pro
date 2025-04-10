import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import config
from routes import content, root

load_dotenv()  # Load environment variables from .env file
print("[STARTUP] Writer Pro Backend starting...")
print(f"[STARTUP] OpenAI API Key present: {bool(config.OPENAI_API_KEY)}")

app = FastAPI()

# --- CORS Configuration --- - Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
print(f"[STARTUP] CORS configured for origins: {config.CORS_ORIGINS}")

# --- Include Routers --- -
app.include_router(content.router)
app.include_router(root.router)

# Print startup message
print("[STARTUP] FastAPI application ready to accept requests")
print("-" * 50)

# --- Run Command (for reference) --- -
# uvicorn main:app --reload --port 8000 