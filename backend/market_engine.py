import random
from datetime import datetime, timedelta


# CONSTANTS
L2_BULL_COLOR = "#0ebb23"
L2_BEAR_COLOR = "#FF0000"


def generate_market_data(steps=100, start_price=1000):
    """
    Generates synthetic market data with 5 and 10 period Simple Moving Averages
    and a 'Ribbon' color state derived from their crossover.
    
    Returns:
        List of dictionaries containing:
        - timestamp: ISO format time
        - price: Current asset price
        - sma_5: 5-period Simple Moving Average (None for first 4 steps)
        - sma_10: 10-period Simple Moving Average (None for first 9 steps)
        - ribbon_color: Hex code indicating trend direction
    """
    data = []
    prices = []
    current_price = start_price
    current_time = datetime.now()
    
    for i in range(steps):
        # Simulate random walk
        change = random.gauss(0, 5)
        current_price += change
        prices.append(current_price)
        
        # Calculate SMAs
        sma_5 = sum(prices[-5:]) / 5 if len(prices) >= 5 else None
        sma_10 = sum(prices[-10:]) / 10 if len(prices) >= 10 else None
        
        # Determine Ribbon Color
        # Logic: If Fast MA (SMA 5) > Slow MA (SMA 10) -> BULL (Green), else BEAR (Red)
        if sma_5 is not None and sma_10 is not None:
            ribbon_color = L2_BULL_COLOR if sma_5 > sma_10 else L2_BEAR_COLOR
        else:
            ribbon_color = None  # No color until both MAs exist
            
        data.append({
            "timestamp": (current_time + timedelta(minutes=i)).isoformat(),
            "price": round(current_price, 2),
            "sma_5": round(sma_5, 2) if sma_5 else None,
            "sma_10": round(sma_10, 2) if sma_10 else None,
            "ribbon_color": ribbon_color
        })
        
    return data


if __name__ == "__main__":
    # Test output
    print(generate_market_data(15))
