export interface Portfolio {
  id: string;
  name: string;
  currency: "USD" | "EUR" | "GBP";
  createdAt: string;
  holdings: Holding[];
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCostBasis: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  holdingId: string;
  type: "BUY" | "SELL" | "DIVIDEND" | "SPLIT";
  shares: number;
  pricePerShare: number;
  date: string;
  fees?: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  timestamp: string;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
