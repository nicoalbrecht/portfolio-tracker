"use client";

import { useState, memo } from "react";
import { useStore } from "@/stores";
import { useQuotes } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EmptyState, WatchlistIcon } from "@/components/ui/empty-state";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export const Watchlist = memo(function Watchlist() {
  const [symbol, setSymbol] = useState("");

  const watchlist = useStore((state) => state.watchlist);
  const addToWatchlist = useStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);

  const symbols = watchlist.map((w) => w.symbol);
  const { data: quotes, isLoading } = useQuotes(symbols);

  const handleAdd = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed && !watchlist.some((w) => w.symbol === trimmed)) {
      addToWatchlist(trimmed);
      setSymbol("");
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-500";
    if (change < 0) return "text-rose-500";
    return "text-muted-foreground";
  };

  return (
    <div className="h-full flex flex-col gap-3 p-1">
      <div className="flex gap-2">
        <Input
          placeholder="Add symbol (e.g., SPY)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={handleAdd} disabled={!symbol.trim()} className="h-8 px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {watchlist.length === 0 ? (
          <EmptyState
            icon={<WatchlistIcon />}
            title="No symbols tracked"
            description="Add symbols to your watchlist to monitor prices"
            className="h-full"
          />
        ) : (
          <div className="space-y-1">
            {watchlist.map((item) => {
              const quote = quotes?.[item.symbol];
              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    {quote && getTrendIcon(quote.change)}
                    <span className="font-mono font-medium">{item.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : quote ? (
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(quote.price)}</div>
                        <div className={`text-xs font-mono ${getChangeColor(quote.change)}`}>
                          {quote.change > 0 ? "+" : ""}
                          {formatPercent(quote.changePercent)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => removeFromWatchlist(item.symbol)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
