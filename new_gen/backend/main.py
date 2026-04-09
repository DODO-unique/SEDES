from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.error_handler import ErrorHandler
from fastapi.responses import JSONResponse

app = FastAPI(title="SEDES Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ErrorHandler)
async def custom_error_handler(request, exc: ErrorHandler):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.message, "error_code": exc.errCode}
    )

@app.get("/")
async def root():
    return {"message": "SEDES API is running"}

from api.routers.auth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

from api.routers.stego import router as stego_router
app.include_router(stego_router, prefix="/api/stego", tags=["Steganography"])
