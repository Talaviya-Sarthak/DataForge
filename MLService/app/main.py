# import logging

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.api.routes import router

# # ── Configure logging for the dataforge namespace ─────────
# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s %(name)s %(levelname)s %(message)s",
# )
# logging.getLogger("dataforge").setLevel(logging.INFO)

# def create_app() -> FastAPI:
#     app = FastAPI(
#         title="MLService",
#         version="1.0.0",
#         description="ML Microservice API"
#     )

#     # CORS: allow ONLY Node.js backend
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=[
#             "http://localhost:5000",  # Node.js backend
#         ],
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

#     app.include_router(router, prefix="/api")
#     return app

# app = create_app()


import logging
import os
import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)

def create_app() -> FastAPI:
    app = FastAPI(
        title="MLService",
        version="1.0.0",
        description="ML Microservice API"
    )

    # ✅ Restrict CORS to backend only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            os.environ.get("BACKEND_URL", "http://localhost:5000"),
        ],
        allow_credentials=True,
        allow_methods=["POST", "GET"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ✅ Health + warmup check
    @app.get("/")
    def health():
        return {"status": "ML service running"}

    @app.get("/warmup")
    def warmup():
        """Keep service warm — call on startup to pre-import heavy modules."""
        import sklearn  # noqa: F401
        import xgboost  # noqa: F401
        return {"status": "warm"}

    app.include_router(router, prefix="/api")
    return app

app = create_app()

# ✅ REQUIRED FOR RENDER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
