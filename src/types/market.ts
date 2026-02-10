export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: "ETF" | "Stock" | "Mutual Fund";
  exchange: string;
  currentPrice?: number;
}

export interface MarketQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface TimeSeriesData {
  symbol: string;
  data: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
