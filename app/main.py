# from fastapi import FastAPI

# from app.api.routes import router as api_router
# from app.core.config import settings

# def create_app() -> FastAPI:
#     app = FastAPI(
#         title=settings.APP_NAME,
#         version=settings.APP_VERSION,
#         description="ML Service Backend API"
#     )

#     # Register API routes
#     app.include_router(api_router, prefix="/api")

#     return app


# app = create_app()






# from fastapi import FastAPI
# from app.api.routes import router

# app = FastAPI(title="MLService")

# app.include_router(router, prefix="/api")





from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

def create_app() -> FastAPI:
    app = FastAPI(
        title="MLService",
        version="1.0.0",
        description="ML Service Backend API"
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, prefix="/api")
    return app

app = create_app()
