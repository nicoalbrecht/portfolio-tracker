"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState, PortfolioIcon } from "@/components/ui/empty-state";
import { useStore } from "@/stores";
import { formatCurrency, formatShares, formatPercent } from "@/lib/formatters";
import { Holding, Quote } from "@/types";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";

interface SortHeaderProps {
  label: string;
  sortKeyName: SortKey;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKeyName, onSort }: SortHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent"
      onClick={() => onSort(sortKeyName)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

interface HoldingsTableProps {
  quotes?: Record<string, Quote>;
  onEdit?: (holding: Holding) => void;
}

type SortKey = "symbol" | "shares" | "value" | "gainLoss" | "allocation";
type SortDirection = "asc" | "desc";

export const HoldingsTable = memo(function HoldingsTable({ quotes = {}, onEdit }: HoldingsTableProps) {
  const { getActivePortfolio, deleteHolding } = useStore();
  const portfolio = getActivePortfolio();
  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio?.holdings]);

  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState<Holding | null>(null);

  const getHoldingValue = useCallback((holding: Holding) => {
    const quote = quotes[holding.symbol];
    return quote ? holding.shares * quote.price : holding.shares * holding.avgCostBasis;
  }, [quotes]);

  const getGainLoss = useCallback((holding: Holding) => {
    const quote = quotes[holding.symbol];
    if (!quote) return { amount: 0, percent: 0 };
    const currentValue = holding.shares * quote.price;
    const costBasis = holding.shares * holding.avgCostBasis;
    const amount = currentValue - costBasis;
    const percent = costBasis > 0 ? (amount / costBasis) * 100 : 0;
    return { amount, percent };
  }, [quotes]);

  const totalValue = useMemo(() => 
    holdings.reduce((sum, h) => sum + getHoldingValue(h), 0),
    [holdings, getHoldingValue]
  );

  const sortedHoldings = useMemo(() => [...holdings].sort((a, b) => {
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
  }), [holdings, sortKey, sortDirection, getHoldingValue, getGainLoss, totalValue]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }, [sortKey]);

  const handleDelete = useCallback((holding: Holding) => {
    setHoldingToDelete(holding);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (holdingToDelete) {
      deleteHolding(holdingToDelete.id);
    }
    setDeleteDialogOpen(false);
    setHoldingToDelete(null);
  }, [holdingToDelete, deleteHolding]);

  const getAriaSortValue = useCallback((key: SortKey): "ascending" | "descending" | "none" => {
    if (sortKey !== key) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  }, [sortKey, sortDirection]);

  if (holdings.length === 0) {
    return (
      <EmptyState
        icon={<PortfolioIcon />}
        title="No holdings yet"
        description="Add your first ETF holding to get started tracking your portfolio"
        className="py-12"
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead aria-sort={getAriaSortValue("symbol")}>
                <SortHeader label="Symbol" sortKeyName="symbol" onSort={handleSort} />
              </TableHead>
              <TableHead className="hidden md:table-cell">Name</TableHead>
              <TableHead className="text-right" aria-sort={getAriaSortValue("shares")}>
                <SortHeader label="Shares" sortKeyName="shares" onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">Avg Cost</TableHead>
              <TableHead className="text-right" aria-sort={getAriaSortValue("value")}>
                <SortHeader label="Value" sortKeyName="value" onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right" aria-sort={getAriaSortValue("gainLoss")}>
                <SortHeader label="Gain/Loss" sortKeyName="gainLoss" onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell" aria-sort={getAriaSortValue("allocation")}>
                <SortHeader label="%" sortKeyName="allocation" onSort={handleSort} />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {holdingToDelete?.symbol}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
