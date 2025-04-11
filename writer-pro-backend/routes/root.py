from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def read_root():
    print("[ENDPOINT] root endpoint called (health check)")
    return {"message": "Writer Pro Backend is running."} 