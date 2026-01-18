import { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import type { StockChartProps, OHLCData, LineData, Timeframe } from "./types";

const timeframeOptions: Timeframe[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "MAX",
];

export function StockChart({
  data,
  type = "candlestick",
  timeframe = "1D",
  volumeData,
  showVolume = false,
  height = 400,
  onTimeframeChange,
}: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<Timeframe>(timeframe);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#10b981",
          width: 1,
          style: 3,
          labelBackgroundColor: "#10b981",
        },
        horzLine: {
          color: "#10b981",
          width: 1,
          style: 3,
          labelBackgroundColor: "#10b981",
        },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    chartRef.current = chart;

    // Add main series (candlestick or line)
    if (type === "candlestick" && data.length > 0 && "open" in data[0]) {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
      candlestickSeries.setData(data as OHLCData[]);
      mainSeriesRef.current = candlestickSeries;
    } else {
      const lineSeries = chart.addLineSeries({
        color: "#10b981",
        lineWidth: 2,
      });
      lineSeries.setData(data as LineData[]);
      mainSeriesRef.current = lineSeries;
    }

    // Add volume series if provided
    if (showVolume && volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addHistogramSeries({
        color: "rgba(16, 185, 129, 0.5)",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [data, type, volumeData, showVolume, height]);

  const handleTimeframeClick = (tf: Timeframe) => {
    setSelectedTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Timeframe selector */}
      <div className="flex gap-1 rounded-md bg-slate-800 p-1">
        {timeframeOptions.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => handleTimeframeClick(tf)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              selectedTimeframe === tf
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className="rounded-lg border border-slate-700 bg-slate-900"
      />
    </div>
  );
}
