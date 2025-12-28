from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from market_engine import generate_market_data

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/market-data")
def get_market_data():
    return generate_market_data(steps=100)

@app.get("/")
def root():
    return {"status": "API is running"}