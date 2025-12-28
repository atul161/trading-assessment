'use client';

import React, { useState, useCallback } from 'react';
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [fullData, setFullData] = useState<any[]>([]);

  const handleChartReady = useCallback(async (chartInstance: any) => {
    setChart(chartInstance);

    try {
      // Import LineSeries for chart API
      const { LineSeries } = await import('lightweight-charts');
      
      const response = await fetch('http://localhost:8000/api/market-data');
      const data = await response.json();
      
      // Store full data for freemium logic
      setFullData(data);
      
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

      // Apply freemium logic - show only first 80 points if not subscribed
      const displayData = isSubscribed ? data : data.slice(0, 80);
      
      // Transform data for chart
      const priceData = displayData.map((d: any, i: number) => ({
        time: i,
        value: d.price,
      }));

      const sma5Data = displayData
        .map((d: any, i: number) => ({
          time: i,
          value: d.sma_5,
        }))
        .filter((d: any) => d.value !== null);

      const sma10Data = displayData
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
      const markers = displayData
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
      if (displayData.length > 0) {
        const lastPrice = displayData[displayData.length - 1].price;
        const firstPrice = displayData[0].price;
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

  // Function to update chart data when subscription status changes
  const updateChartData = useCallback(async () => {
    if (!chart || fullData.length === 0) return;

    try {
      const { LineSeries } = await import('lightweight-charts');
      
      // Apply freemium logic - show only first 80 points if not subscribed
      const displayData = isSubscribed ? fullData : fullData.slice(0, 80);
      
      // Transform data for chart
      const priceData = displayData.map((d: any, i: number) => ({
        time: i,
        value: d.price,
      }));

      const sma5Data = displayData
        .map((d: any, i: number) => ({
          time: i,
          value: d.sma_5,
        }))
        .filter((d: any) => d.value !== null);

      const sma10Data = displayData
        .map((d: any, i: number) => ({
          time: i,
          value: d.sma_10,
        }))
        .filter((d: any) => d.value !== null);

      // Get existing series
      const series = chart.options();
      const allSeries = [];
      chart.removeSeries = chart.removeSeries || (() => {});
      
      // Clear existing series
      try {
        const existingSeries = chart.__series || [];
        existingSeries.forEach((s: any) => {
          chart.removeSeries(s);
        });
      } catch (e) {
        // Fallback: create new series
      }

      // Create new series
      const priceSeries = chart.addSeries(LineSeries, {
        color: '#00D4FF',
        lineWidth: 3,
        title: 'Price',
      });

      const sma5Series = chart.addSeries(LineSeries, {
        color: '#FF6B35',
        lineWidth: 2,
        title: 'SMA 5',
      });

      const sma10Series = chart.addSeries(LineSeries, {
        color: '#7C3AED',
        lineWidth: 2,
        title: 'SMA 10',
      });

      // Set new data
      priceSeries.setData(priceData);
      sma5Series.setData(sma5Data);
      sma10Series.setData(sma10Data);

      // Add color zones
      const markers = displayData
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

      // Update price display
      if (displayData.length > 0) {
        const lastPrice = displayData[displayData.length - 1].price;
        const firstPrice = displayData[0].price;
        setCurrentPrice(lastPrice);
        setPriceChange(((lastPrice - firstPrice) / firstPrice) * 100);
      }

      chart.timeScale().fitContent();
    } catch (err) {
      console.error('Error updating chart data:', err);
    }
  }, [chart, fullData, isSubscribed]);

  // Update chart when subscription status changes
  React.useEffect(() => {
    if (chart && fullData.length > 0) {
      updateChartData();
    }
  }, [isSubscribed, updateChartData]);

  // Function to simulate payment
  const handleSimulatePayment = () => {
    setIsSubscribed(true);
  };

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
                <div className="relative w-full h-[600px]">
                  <ChartWrapper onChartReady={handleChartReady} />
                  
                  {/* Freemium Overlay - Glass Effect */}
                  {!isSubscribed && (
                    <div className="absolute top-0 right-0 w-1/3 h-full backdrop-blur-md bg-gradient-to-l from-gray-900/40 via-gray-800/30 to-transparent border-l border-white/20 shadow-2xl flex flex-col items-center justify-center z-10">
                      {/* Glass card */}
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 m-4 max-w-xs">
                        <div className="text-center">
                          {/* Icon with glass effect */}
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/80 to-orange-500/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                            <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-3 drop-shadow-lg">Premium Data</h3>
                          <p className="text-gray-200 text-sm mb-6 leading-relaxed drop-shadow-md">
                            The latest 20 data points are locked.<br/>
                            <span className="text-yellow-300">Upgrade to unlock real-time insights.</span>
                          </p>
                          
                          <button
                            onClick={handleSimulatePayment}
                            className="w-full bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm hover:from-yellow-300 hover:to-orange-400 text-white font-semibold py-3 px-6 rounded-xl border border-white/30 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl"
                          >
                            <span className="flex items-center justify-center space-x-2">
                              <span>🚀</span>
                              <span>Subscribe to Unlock</span>
                            </span>
                          </button>
                          
                          <p className="text-xs text-gray-300 mt-3 opacity-75">
                            Click to simulate payment
                          </p>
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400/50 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-8 right-8 w-1 h-1 bg-orange-400/50 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
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

            {/* Subscription Status */}
            {!isSubscribed && (
              <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">🔒 Premium Features</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Unlock the latest 20 data points and get real-time market insights.
                </p>
                <button 
                  onClick={handleSimulatePayment}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Simulate Payment
                </button>
              </div>
            )}

            {/* Subscription Confirmed */}
            {isSubscribed && (
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm rounded-xl border border-green-500/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">✅ Premium Active</h3>
                <p className="text-gray-300 text-sm mb-4">
                  You now have access to all 100 data points and real-time updates.
                </p>
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Data Active</span>
                </div>
              </div>
            )}

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