"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";
import { useStore } from "@/stores";
import { Quote } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceChartProps {
  quotes?: Record<string, Quote>;
}

export function PriceChart({ quotes = {} }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });

  const holdings = portfolio?.holdings ?? [];
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");

  useEffect(() => {
    if (symbols.length > 0 && (!selectedSymbol || !symbols.includes(selectedSymbol))) {
      setSelectedSymbol(symbols[0]);
    }
  }, [symbols, selectedSymbol]);

  const mockPriceData = useMemo(() => {
    if (!selectedSymbol) return [];

    const quote = quotes[selectedSymbol];
    const holding = holdings.find((h) => h.symbol === selectedSymbol);
    const basePrice = quote?.price ?? holding?.avgCostBasis ?? 100;

    const today = new Date();
    const data: { time: string; open: number; high: number; low: number; close: number }[] = [];

    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const volatility = 0.015;
      const randomWalk = (Math.random() - 0.5) * volatility * 2;
      const trend = (90 - i) / 90 * 0.05;
      const factor = 1 + randomWalk + trend * (Math.random() > 0.5 ? 1 : -1);

      const previousPrice = data.length > 0 ? data[data.length - 1].close : basePrice * 0.95;
      const close = previousPrice * factor;
      const open = previousPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);

      data.push({
        time: date.toISOString().split("T")[0],
        open,
        high,
        low,
        close,
      });
    }

    if (data.length > 0 && quote?.price) {
      const last = data[data.length - 1];
      last.close = quote.price;
      last.high = Math.max(last.high, quote.price);
      last.low = Math.min(last.low, quote.price);
    }

    return data;
  }, [selectedSymbol, quotes, holdings]);

  useEffect(() => {
    if (!chartContainerRef.current || mockPriceData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa", // muted-foreground equivalent
      },
      grid: {
        vertLines: { color: "#27272a" }, // border equivalent
        horzLines: { color: "#27272a" }, // border equivalent
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
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
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [mockPriceData]);

  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Add holdings to see price charts</p>
      </div>
    );
  }

  const currentQuote = quotes[selectedSymbol];
  const holding = holdings.find((h) => h.symbol === selectedSymbol);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
          <SelectTrigger className="w-32">
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
            <p className="font-bold font-mono">${currentQuote.price.toFixed(2)}</p>
            <p className={`text-xs font-mono ${currentQuote.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {currentQuote.change >= 0 ? "+" : ""}
              {currentQuote.change.toFixed(2)} ({currentQuote.changePercent.toFixed(2)}%)
            </p>
          </div>
        )}
      </div>

      <div ref={chartContainerRef} className="flex-1 min-h-0" />

      {holding && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex justify-between">
          <span>Shares: {holding.shares}</span>
          <span>Avg Cost: ${holding.avgCostBasis.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
