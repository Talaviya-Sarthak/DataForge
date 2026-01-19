from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

def create_app() -> FastAPI:
    app = FastAPI(
        title="MLService",
        version="1.0.0",
        description="ML Microservice API"
    )

    # CORS: allow ONLY Node.js backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5000",  # Node.js backend
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, prefix="/api")
    return app

app = create_app()