"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useStore } from "@/stores";
import { Quote } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface AllocationChartProps {
  quotes?: Record<string, Quote>;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function AllocationChart({ quotes = {} }: AllocationChartProps) {
  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });

  const holdings = portfolio?.holdings ?? [];

  const chartData = useMemo(() => {
    if (holdings.length === 0) return [];

    const data = holdings.map((holding) => {
      const quote = quotes[holding.symbol];
      const currentPrice = quote?.price ?? holding.avgCostBasis;
      const value = holding.shares * currentPrice;

      return {
        name: holding.symbol,
        fullName: holding.name,
        value,
        shares: holding.shares,
      };
    });

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    return data
      .map((item) => ({
        ...item,
        percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, quotes]);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Add holdings to see allocation</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((item, index) => (
              <Cell 
                key={item.name} 
                fill={COLORS[index % COLORS.length]}
                className="stroke-background"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{data.fullName}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-mono">{formatCurrency(data.value)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Allocation:</span>
                      <span className="font-mono">{formatPercent(data.percentage)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Shares:</span>
                      <span className="font-mono">{data.shares.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => {
              const data = chartData.find((d) => d.name === value);
              return (
                <span className="text-sm">
                  {value} <span className="text-muted-foreground">({formatPercent(data?.percentage ?? 0)})</span>
                </span>
              );
            }}
            wrapperStyle={{ paddingLeft: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2 pb-2">
        <p className="text-xs text-muted-foreground">Total Value</p>
        <p className="text-lg font-bold font-mono">{formatCurrency(totalValue)}</p>
      </div>
    </div>
  );
}
