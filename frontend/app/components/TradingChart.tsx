'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ChartWrapper = dynamic(() => import('./ChartWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-800 flex items-center justify-center">Loading chart...</div>
});

export default function TradingChart() {
  const [chart, setChart] = useState<any>(null);

  const handleChartReady = useCallback(async (chartInstance: any) => {
    setChart(chartInstance);

    try {
      // Import LineSeries for chart API
      const { LineSeries } = await import('lightweight-charts');
      
      const response = await fetch('http://localhost:8000/api/market-data');
      const data = await response.json();
      
      // Create three line series using the correct API
      const priceSeries = chartInstance.addSeries(LineSeries, {
        color: '#2196F3',
        lineWidth: 2,
        title: 'Price',
      });

      const sma5Series = chartInstance.addSeries(LineSeries, {
        color: '#FFA726',
        lineWidth: 2,
        title: 'SMA 5',
      });

      const sma10Series = chartInstance.addSeries(LineSeries, {
        color: '#AB47BC',
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
          color: d.ribbon_color === '#0ebb23' ? '#0ebb2340' : '#FF000040',
          shape: 'square' as const,
          ribbonColor: d.ribbon_color
        }))
        .filter((m: any) => m.ribbonColor !== null);

      if (markers.length > 0) {
        priceSeries.setMarkers(markers);
      }

      chartInstance.timeScale().fitContent();
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  return (
    <div className="w-full h-full">
      <ChartWrapper onChartReady={handleChartReady} />
    </div>
  );
}