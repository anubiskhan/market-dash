import type { Time } from "lightweight-charts";

export interface OHLCData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: Time;
  value: number;
  color?: string;
}

export interface LineData {
  time: Time;
  value: number;
}

export type ChartType = "candlestick" | "line";

export type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

export interface StockChartProps {
  data: OHLCData[] | LineData[];
  type?: ChartType;
  timeframe?: Timeframe;
  volumeData?: VolumeData[];
  showVolume?: boolean;
  height?: number;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

export interface MiniChartProps {
  data: LineData[];
  height?: number;
  width?: number;
  lineColor?: string;
  areaColor?: string;
  showLastPrice?: boolean;
}
