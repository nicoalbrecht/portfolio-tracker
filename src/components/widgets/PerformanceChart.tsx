"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useStore } from "@/stores";
import { Quote } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface PerformanceChartProps {
  quotes?: Record<string, Quote>;
}

export function PerformanceChart({ quotes = {} }: PerformanceChartProps) {
  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });

  const holdings = portfolio?.holdings ?? [];

  const currentValue = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const quote = quotes[holding.symbol];
      const price = quote?.price ?? holding.avgCostBasis;
      return sum + holding.shares * price;
    }, 0);
  }, [holdings, quotes]);

  const costBasis = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      return sum + holding.shares * holding.avgCostBasis;
    }, 0);
  }, [holdings]);

  const mockPerformanceData = useMemo(() => {
    if (holdings.length === 0) return [];

    const today = new Date();
    const data = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const volatility = 0.02;
      const trend = (30 - i) / 30;
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      const trendFactor = costBasis > 0 
        ? 1 + (currentValue - costBasis) / costBasis * trend
        : 1;
      
      const value = costBasis * trendFactor * randomFactor;
      
      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Math.max(0, value),
        fullDate: date.toISOString(),
      });
    }
    
    if (data.length > 0) {
      data[data.length - 1].value = currentValue;
    }
    
    return data;
  }, [holdings, currentValue, costBasis]);

  const minValue = useMemo(() => {
    if (mockPerformanceData.length === 0) return 0;
    const min = Math.min(...mockPerformanceData.map((d) => d.value));
    return min * 0.95;
  }, [mockPerformanceData]);

  const maxValue = useMemo(() => {
    if (mockPerformanceData.length === 0) return 0;
    const max = Math.max(...mockPerformanceData.map((d) => d.value));
    return max * 1.05;
  }, [mockPerformanceData]);

  const isPositive = currentValue >= costBasis;

  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Add holdings to see performance</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Current Value</p>
          <p className="text-xl font-bold font-mono">{formatCurrency(currentValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">30 Day Change</p>
          <p className={`text-lg font-bold font-mono ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
            {isPositive ? "+" : ""}{formatCurrency(currentValue - costBasis)}
          </p>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockPerformanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={45}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{data.date}</p>
                    <p className="font-bold font-mono">{formatCurrency(data.value)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#performanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        * Simulated historical data for demonstration
      </p>
    </div>
  );
}
