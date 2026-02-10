"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores";
import { formatCurrency, formatShares, formatPercent } from "@/lib/formatters";
import { Holding, Quote } from "@/types";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";

interface HoldingsTableProps {
  quotes?: Record<string, Quote>;
  onEdit?: (holding: Holding) => void;
}

type SortKey = "symbol" | "shares" | "value" | "gainLoss" | "allocation";
type SortDirection = "asc" | "desc";

export function HoldingsTable({ quotes = {}, onEdit }: HoldingsTableProps) {
  const { getActivePortfolio, deleteHolding } = useStore();
  const portfolio = getActivePortfolio();
  const holdings = portfolio?.holdings ?? [];

  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const getHoldingValue = (holding: Holding) => {
    const quote = quotes[holding.symbol];
    return quote ? holding.shares * quote.price : holding.shares * holding.avgCostBasis;
  };

  const getGainLoss = (holding: Holding) => {
    const quote = quotes[holding.symbol];
    if (!quote) return { amount: 0, percent: 0 };
    const currentValue = holding.shares * quote.price;
    const costBasis = holding.shares * holding.avgCostBasis;
    const amount = currentValue - costBasis;
    const percent = costBasis > 0 ? (amount / costBasis) * 100 : 0;
    return { amount, percent };
  };

  const totalValue = holdings.reduce((sum, h) => sum + getHoldingValue(h), 0);

  const sortedHoldings = [...holdings].sort((a, b) => {
    let aVal: number, bVal: number;

    switch (sortKey) {
      case "symbol":
        return sortDirection === "asc"
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      case "shares":
        aVal = a.shares;
        bVal = b.shares;
        break;
      case "value":
        aVal = getHoldingValue(a);
        bVal = getHoldingValue(b);
        break;
      case "gainLoss":
        aVal = getGainLoss(a).amount;
        bVal = getGainLoss(b).amount;
        break;
      case "allocation":
        aVal = totalValue > 0 ? getHoldingValue(a) / totalValue : 0;
        bVal = totalValue > 0 ? getHoldingValue(b) / totalValue : 0;
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const handleDelete = (holding: Holding) => {
    if (confirm(`Delete ${holding.symbol}?`)) {
      deleteHolding(holding.id);
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent"
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No holdings yet</p>
        <p className="text-sm text-muted-foreground">
          Add your first ETF holding to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader label="Symbol" sortKeyName="symbol" />
            </TableHead>
            <TableHead className="hidden md:table-cell">Name</TableHead>
            <TableHead className="text-right">
              <SortHeader label="Shares" sortKeyName="shares" />
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">Avg Cost</TableHead>
            <TableHead className="text-right">
              <SortHeader label="Value" sortKeyName="value" />
            </TableHead>
            <TableHead className="text-right">
              <SortHeader label="Gain/Loss" sortKeyName="gainLoss" />
            </TableHead>
            <TableHead className="text-right hidden lg:table-cell">
              <SortHeader label="%" sortKeyName="allocation" />
            </TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHoldings.map((holding) => {
            const quote = quotes[holding.symbol];
            const value = getHoldingValue(holding);
            const { amount: gainLossAmt, percent: gainLossPct } = getGainLoss(holding);
            const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

            return (
              <TableRow key={holding.id}>
                <TableCell className="font-medium font-mono-numbers">
                  {holding.symbol}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                  {holding.name}
                </TableCell>
                <TableCell className="text-right font-mono-numbers">
                  {formatShares(holding.shares)}
                </TableCell>
                <TableCell className="text-right font-mono-numbers hidden sm:table-cell">
                  {formatCurrency(holding.avgCostBasis)}
                </TableCell>
                <TableCell className="text-right font-mono-numbers">
                  {formatCurrency(value)}
                  {quote && (
                    <div className="text-xs text-muted-foreground">
                      @{formatCurrency(quote.price)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono-numbers">
                  <span className={gainLossAmt >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {gainLossAmt >= 0 ? "+" : ""}
                    {formatCurrency(gainLossAmt)}
                  </span>
                  <div
                    className={`text-xs ${gainLossPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {formatPercent(gainLossPct)}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono-numbers hidden lg:table-cell">
                  {allocation.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(holding)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(holding)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
