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

    # ✅ FIXED CORS (important)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ✅ Health check
    @app.get("/")
    def health():
        return {"status": "ML service running"}

    app.include_router(router, prefix="/api")
    return app

app = create_app()

# ✅ REQUIRED FOR RENDER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)