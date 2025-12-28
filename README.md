# Trading Assessment

## Setup & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3000

## Features
- FastAPI backend serving market data
- Next.js frontend with TradingView Lightweight Charts
- Green/Red color logic: Green when SMA_5 > SMA_10 (bullish), Red otherwise