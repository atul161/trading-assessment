'use client';

import { createChart, IChartApi, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface ChartWrapperProps {
  onChartReady?: (chart: IChartApi) => void;
}

export default function ChartWrapper({ onChartReady }: ChartWrapperProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with enhanced styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: 'transparent' },
        textColor: '#E5E7EB',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6B7280',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1F2937',
        },
        horzLine: {
          color: '#6B7280',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1F2937',
        },
      },
      timeScale: {
        borderColor: '#4B5563',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#4B5563',
      },
      watermark: {
        visible: true,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: '#1F2937',
        text: 'TradingView Pro',
      },
    });

    chartRef.current = chart;

    // Call the callback with the chart instance
    if (onChartReady) {
      onChartReady(chart);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [onChartReady]);

  return <div ref={chartContainerRef} className="w-full" />;
}