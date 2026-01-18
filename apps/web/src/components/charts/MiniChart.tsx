import { useEffect, useRef } from "react";
import { createChart, type IChartApi, ColorType } from "lightweight-charts";
import type { MiniChartProps } from "./types";

export function MiniChart({
  data,
  height = 60,
  width,
  lineColor,
  areaColor,
  showLastPrice = false,
}: MiniChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Determine if trend is positive or negative
  const isPositive =
    data.length >= 2 && data[data.length - 1].value >= data[0].value;

  // Use appropriate colors based on trend
  const trendLineColor = isPositive ? "#10b981" : "#ef4444";
  const trendAreaColor = isPositive
    ? "rgba(16, 185, 129, 0.2)"
    : "rgba(239, 68, 68, 0.2)";

  const finalLineColor = lineColor || trendLineColor;
  const finalAreaColor = areaColor || trendAreaColor;

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create minimal chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        visible: showLastPrice,
        borderVisible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      width: width || chartContainerRef.current.clientWidth,
      height: height,
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Add area series for sparkline effect
    const areaSeries = chart.addAreaSeries({
      lineColor: finalLineColor,
      topColor: finalAreaColor,
      bottomColor: "transparent",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: showLastPrice,
    });

    areaSeries.setData(data);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: width || chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height, width, finalLineColor, finalAreaColor, showLastPrice]);

  return <div ref={chartContainerRef} className="w-full" />;
}
