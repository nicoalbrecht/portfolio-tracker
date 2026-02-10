"use client";

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivePortfolio } from "@/hooks";
import { EmptyState, PortfolioIcon } from "@/components/ui/empty-state";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Quote } from "@/types";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface PortfolioSummaryProps {
  quotes?: Record<string, Quote>;
}

export const PortfolioSummary = memo(function PortfolioSummary({ quotes = {} }: PortfolioSummaryProps) {
  const portfolio = useActivePortfolio();

  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio?.holdings]);

  const calculations = useMemo(() => holdings.reduce(
    (acc, holding) => {
      const quote = quotes[holding.symbol];
      const currentPrice = quote?.price ?? holding.avgCostBasis;
      const currentValue = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCostBasis;
      const dayChange = quote ? holding.shares * quote.change : 0;

      return {
        totalValue: acc.totalValue + currentValue,
        totalCost: acc.totalCost + costBasis,
        dayChange: acc.dayChange + dayChange,
      };
    },
    { totalValue: 0, totalCost: 0, dayChange: 0 }
  ), [holdings, quotes]);

  const { totalGainLoss, totalGainLossPercent, dayChangePercent } = useMemo(() => {
    const gainLoss = calculations.totalValue - calculations.totalCost;
    const gainLossPercent = calculations.totalCost > 0
      ? (gainLoss / calculations.totalCost) * 100
      : 0;
    const dayPct = calculations.totalValue - calculations.dayChange > 0
      ? (calculations.dayChange / (calculations.totalValue - calculations.dayChange)) * 100
      : 0;
    return { totalGainLoss: gainLoss, totalGainLossPercent: gainLossPercent, dayChangePercent: dayPct };
  }, [calculations]);

  const isPositiveDay = calculations.dayChange >= 0;
  const isPositiveTotal = totalGainLoss >= 0;

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<PortfolioIcon className="h-8 w-8" />}
            title="No holdings"
            description="Add your first holding to get started"
            className="py-4"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold font-mono-numbers">
            {formatCurrency(calculations.totalValue)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {isPositiveDay ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-500" />
            )}
            <span
              className={`text-xs font-mono-numbers ${
                isPositiveDay ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isPositiveDay ? "+" : ""}
              {formatCurrency(calculations.dayChange)} ({formatPercent(dayChangePercent)})
            </span>
            <span className="text-xs text-muted-foreground">today</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Gain/Loss</span>
            <span
              className={`font-mono-numbers font-medium ${
                isPositiveTotal ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isPositiveTotal ? "+" : ""}
              {formatCurrency(totalGainLoss)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Return</span>
            <span
              className={`font-mono-numbers font-medium ${
                isPositiveTotal ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {formatPercent(totalGainLossPercent)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Cost Basis</span>
            <span className="font-mono-numbers text-muted-foreground">
              {formatCurrency(calculations.totalCost)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
