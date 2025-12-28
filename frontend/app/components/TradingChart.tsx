'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ChartWrapper = dynamic(() => import('./ChartWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-300 text-lg font-medium">Loading Trading Chart...</p>
      </div>
    </div>
  )
});

export default function TradingChart() {
  const [chart, setChart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  const handleChartReady = useCallback(async (chartInstance: any) => {
    setChart(chartInstance);

    try {
      // Import LineSeries for chart API
      const { LineSeries } = await import('lightweight-charts');
      
      const response = await fetch('http://localhost:8000/api/market-data');
      const data = await response.json();
      
      // Create three line series using the correct API
      const priceSeries = chartInstance.addSeries(LineSeries, {
        color: '#00D4FF',
        lineWidth: 3,
        title: 'Price',
      });

      const sma5Series = chartInstance.addSeries(LineSeries, {
        color: '#FF6B35',
        lineWidth: 2,
        title: 'SMA 5',
      });

      const sma10Series = chartInstance.addSeries(LineSeries, {
        color: '#7C3AED',
        lineWidth: 2,
        title: 'SMA 10',
      });

      // Transform data for chart
      const priceData = data.map((d: any, i: number) => ({
        time: i,
        value: d.price,
      }));

      const sma5Data = data
        .map((d: any, i: number) => ({
          time: i,
          value: d.sma_5,
        }))
        .filter((d: any) => d.value !== null);

      const sma10Data = data
        .map((d: any, i: number) => ({
          time: i,
          value: d.sma_10,
        }))
        .filter((d: any) => d.value !== null);

      // Set data
      priceSeries.setData(priceData);
      sma5Series.setData(sma5Data);
      sma10Series.setData(sma10Data);

      // Add color zones based on ribbon_color
      const markers = data
        .map((d: any, i: number) => ({
          time: i,
          position: 'inBar' as const,
          color: d.ribbon_color === '#0ebb23' ? '#10B98150' : '#EF444450',
          shape: 'square' as const,
          ribbonColor: d.ribbon_color
        }))
        .filter((m: any) => m.ribbonColor !== null);

      if (markers.length > 0) {
        priceSeries.setMarkers(markers);
      }

      // Set current price and calculate change
      if (data.length > 0) {
        const lastPrice = data[data.length - 1].price;
        const firstPrice = data[0].price;
        setCurrentPrice(lastPrice);
        setPriceChange(((lastPrice - firstPrice) / firstPrice) * 100);
      }

      chartInstance.timeScale().fitContent();
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TradingView Pro</h1>
                <p className="text-gray-400 text-sm">Real-time Market Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</div>
                <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Price Chart</h2>
                  <div className="flex items-center space-x-4">
                    {/* Legend */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <span className="text-gray-300">Price</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <span className="text-gray-300">SMA 5</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">SMA 10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ChartWrapper onChartReady={handleChartReady} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h High</span>
                  <span className="text-white font-medium">${(currentPrice * 1.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h Low</span>
                  <span className="text-white font-medium">${(currentPrice * 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volume</span>
                  <span className="text-white font-medium">1.2M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white font-medium">$847B</span>
                </div>
              </div>
            </div>

            {/* Trading Signals */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Signals</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-900/30 rounded-lg border border-green-800/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <div className="text-green-400 text-sm font-medium">BUY Signal</div>
                    <div className="text-gray-400 text-xs">SMA Crossover</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-900/30 rounded-lg border border-yellow-800/50">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div>
                    <div className="text-yellow-400 text-sm font-medium">HOLD Signal</div>
                    <div className="text-gray-400 text-xs">Price Consolidation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Buy Now
                </button>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Sell Now
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Set Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}