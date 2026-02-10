"use client";

import { useEffect, useRef, useMemo, useState, memo } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";
import { useActivePortfolio } from "@/hooks";
import { Quote } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ChartIcon } from "@/components/ui/empty-state";
import { createSeededRandom, hashString } from "@/lib/utils";

interface PriceChartProps {
  quotes?: Record<string, Quote>;
}

export const PriceChart = memo(function PriceChart({ quotes = {} }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const portfolio = useActivePortfolio();

  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio?.holdings]);
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  
  const [userSelectedSymbol, setUserSelectedSymbol] = useState<string>("");
  
  const selectedSymbol = useMemo(() => {
    if (userSelectedSymbol && symbols.includes(userSelectedSymbol)) {
      return userSelectedSymbol;
    }
    return symbols[0] ?? "";
  }, [userSelectedSymbol, symbols]);

  const mockPriceData = useMemo(() => {
    if (!selectedSymbol) return [];

    const quote = quotes[selectedSymbol];
    const holding = holdings.find((h) => h.symbol === selectedSymbol);
    const basePrice = quote?.price ?? holding?.avgCostBasis ?? 100;

    const today = new Date();
    const data: { time: string; open: number; high: number; low: number; close: number }[] = [];
    
    const seed = hashString(selectedSymbol);
    const random = createSeededRandom(seed);

    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const volatility = 0.015;
      const randomWalk = (random() - 0.5) * volatility * 2;
      const trend = (90 - i) / 90 * 0.05;
      const factor = 1 + randomWalk + trend * (random() > 0.5 ? 1 : -1);

      const lastDataPoint = data[data.length - 1];
      const previousPrice = lastDataPoint ? lastDataPoint.close : basePrice * 0.95;
      const close = previousPrice * factor;
      const open = previousPrice;
      const high = Math.max(open, close) * (1 + random() * 0.01);
      const low = Math.min(open, close) * (1 - random() * 0.01);

      const dateStr = date.toISOString().split("T")[0];
      if (dateStr) {
        data.push({
          time: dateStr,
          open,
          high,
          low,
          close,
        });
      }
    }

    if (data.length > 0 && quote?.price) {
      const last = data[data.length - 1];
      if (last) {
        last.close = quote.price;
        last.high = Math.max(last.high, quote.price);
        last.low = Math.min(last.low, quote.price);
      }
    }

    return data;
  }, [selectedSymbol, quotes, holdings]);

  useEffect(() => {
    if (!chartContainerRef.current || mockPriceData.length === 0) return;

    // Track if effect is still active to prevent race conditions
    let isActive = true;
    const container = chartContainerRef.current;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa", // muted-foreground equivalent
      },
      grid: {
        vertLines: { color: "#27272a" }, // border equivalent
        horzLines: { color: "#27272a" }, // border equivalent
      },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        horzLine: {
          labelBackgroundColor: "#18181b", // primary equivalent
        },
        vertLine: {
          labelBackgroundColor: "#18181b", // primary equivalent
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    candlestickSeries.setData(mockPriceData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (isActive && chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      isActive = false;
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [mockPriceData]);

  if (holdings.length === 0) {
    return (
      <EmptyState
        icon={<ChartIcon />}
        title="No price data"
        description="Add holdings to see price charts"
        className="h-full"
      />
    );
  }

  const currentQuote = quotes[selectedSymbol];
  const holding = holdings.find((h) => h.symbol === selectedSymbol);

  return (
    <div className="h-full flex flex-col" role="figure" aria-label={`Price chart for ${selectedSymbol}`}>
      {currentQuote && (
        <span className="sr-only">
          {selectedSymbol} current price: {formatCurrency(currentQuote.price)}, 
          change: {currentQuote.change >= 0 ? "up" : "down"} {formatCurrency(Math.abs(currentQuote.change))}.
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <Select value={selectedSymbol} onValueChange={setUserSelectedSymbol}>
          <SelectTrigger className="w-32" aria-label="Select stock symbol">
            <SelectValue placeholder="Select symbol" />
          </SelectTrigger>
          <SelectContent>
            {symbols.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentQuote && (
          <div className="text-right">
            <p className="font-bold font-mono">{formatCurrency(currentQuote.price)}</p>
            <p className={`text-xs font-mono ${currentQuote.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {currentQuote.change >= 0 ? "+" : ""}
              {formatCurrency(currentQuote.change)} ({formatPercent(currentQuote.changePercent)})
            </p>
          </div>
        )}
      </div>

      <div ref={chartContainerRef} className="flex-1 min-h-0" aria-hidden="true" />

      {holding && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex justify-between">
          <span>Shares: {holding.shares}</span>
          <span>Avg Cost: {formatCurrency(holding.avgCostBasis)}</span>
        </div>
      )}
    </div>
  );
});
