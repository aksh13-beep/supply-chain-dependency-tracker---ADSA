from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Supply Chain Dependency Tracker",
    description="API for supply chain dependency and risk analysis",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Supply Chain Dependency Tracker API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }