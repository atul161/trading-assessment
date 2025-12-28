'use client';

import { useEffect, useRef } from 'react';

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (typeof window === 'undefined') return; // Ensure we're on client side

    // Dynamic import to avoid SSR issues
    const initializeChart = async () => {
      try {
        const { createChart } = await import('lightweight-charts');
        
        // Create chart
        const chart = createChart(chartContainerRef.current!, {
          width: chartContainerRef.current!.clientWidth,
          height: 500,
          layout: {
            background: { color: '#1a1a1a' },
            textColor: '#d1d5db',
          },
          grid: {
            vertLines: { color: '#2a2a2a' },
            horzLines: { color: '#2a2a2a' },
          },
        });

        // Verify chart was created successfully
        if (!chart || typeof chart.addLineSeries !== 'function') {
          console.error('Chart creation failed or addLineSeries method not available');
          return;
        }

        chartRef.current = chart;

    // Function to fetch and render data
    const fetchAndRenderData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/market-data');
        const data = await response.json();
        
        // Debug: Check chart object
        console.log('Chart object:', chart);
        console.log('Chart methods:', Object.getOwnPropertyNames(chart));
        console.log('addLineSeries method:', chart.addLineSeries);
        
        // Create three line series
        const priceSeries = chart.addLineSeries({
          color: '#2196F3',
          lineWidth: 2,
          title: 'Price',
        });

        const sma5Series = chart.addLineSeries({
          color: '#FFA726',
          lineWidth: 2,
          title: 'SMA 5',
        });

        const sma10Series = chart.addLineSeries({
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

        chart.timeScale().fitContent();
      } catch (err) {
        console.error('Error fetching data:', err);
        // Show error message in chart container
        if (chartContainerRef.current) {
          chartContainerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 500px; color: #ff0000;">
              <div>
                <h3>Error loading chart data</h3>
                <p>Check console for details</p>
                <p>Make sure backend is running on port 8000</p>
              </div>
            </div>
          `;
        }
      }
    };

    // Fetch data after chart is created
    fetchAndRenderData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}