"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/stores";
import { holdingSchema, HoldingFormData } from "@/lib/validators";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { SymbolSearch } from "./SymbolSearch";
import { SearchResult } from "@/lib/api";

interface AddHoldingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddHoldingForm({ open, onOpenChange }: AddHoldingFormProps) {
  const { addHolding, portfolios, activePortfolioId, createPortfolio } = useStore();
  const [currentPrice] = useState<number | null>(null);

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    register,
    formState: { errors, isSubmitting },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      symbol: "",
      name: "",
      shares: undefined,
      avgCostBasis: undefined,
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const symbolValue = watch("symbol");
  const nameValue = watch("name");
  const shares = watch("shares");
  const avgCostBasis = watch("avgCostBasis");
  const totalCost = shares && avgCostBasis ? shares * avgCostBasis : 0;
  const currentValue = shares && currentPrice ? shares * currentPrice : null;
  const gainLoss = currentValue && totalCost ? currentValue - totalCost : null;

  const handleSymbolChange = useCallback(
    (symbol: string) => {
      setValue("symbol", symbol, { shouldValidate: symbol.length > 0 });
    },
    [setValue]
  );

  const handleSymbolResultSelect = useCallback(
    (result: SearchResult) => {
      setValue("symbol", result.symbol.toUpperCase(), { shouldValidate: true });
      setValue("name", result.name, { shouldValidate: true });
    },
    [setValue]
  );

  const handleNameChange = useCallback(
    (name: string) => {
      setValue("name", name, { shouldValidate: name.length > 0 });
    },
    [setValue]
  );

  const handleNameResultSelect = useCallback(
    (result: SearchResult) => {
      setValue("symbol", result.symbol.toUpperCase(), { shouldValidate: true });
      setValue("name", result.name, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = (data: HoldingFormData) => {
    let portfolioId = activePortfolioId;
    if (!portfolioId) {
      portfolioId = createPortfolio("My Portfolio");
    }

    addHolding({
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      shares: data.shares,
      avgCostBasis: data.avgCostBasis,
      purchaseDate: data.purchaseDate,
      notes: data.notes,
    });

    toast.success(`Added ${data.symbol.toUpperCase()} to portfolio`);
    reset();
    onOpenChange(false);
  };

  const handleAddAnother = (data: HoldingFormData) => {
    let portfolioId = activePortfolioId;
    if (!portfolioId && portfolios.length === 0) {
      portfolioId = createPortfolio("My Portfolio");
    }

    addHolding({
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      shares: data.shares,
      avgCostBasis: data.avgCostBasis,
      purchaseDate: data.purchaseDate,
      notes: data.notes,
    });

    toast.success(`Added ${data.symbol.toUpperCase()} to portfolio`);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Holding</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <SymbolSearch
              value={symbolValue}
              onSymbolChange={handleSymbolChange}
              onResultSelect={handleSymbolResultSelect}
              placeholder="Search by symbol (e.g., VTI)"
              aria-invalid={!!errors.symbol}
            />
            {errors.symbol && (
              <p className="text-sm text-destructive">{errors.symbol.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <SymbolSearch
              value={nameValue}
              onSymbolChange={handleNameChange}
              onResultSelect={handleNameResultSelect}
              placeholder="Search by company name"
              searchMode="name"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares *</Label>
              <Input
                id="shares"
                type="number"
                step="0.0001"
                placeholder="50"
                {...register("shares", { valueAsNumber: true })}
              />
              {errors.shares && (
                <p className="text-sm text-destructive">{errors.shares.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avgCostBasis">Cost per Share *</Label>
              <Input
                id="avgCostBasis"
                type="number"
                step="0.01"
                placeholder="245.00"
                {...register("avgCostBasis", { valueAsNumber: true })}
              />
              {errors.avgCostBasis && (
                <p className="text-sm text-destructive">{errors.avgCostBasis.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              {...register("purchaseDate")}
            />
            {errors.purchaseDate && (
              <p className="text-sm text-destructive">{errors.purchaseDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Bought during market dip"
              {...register("notes")}
            />
          </div>

          {totalCost > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-mono-numbers text-right">
                  {formatCurrency(totalCost)}
                </span>
                {currentValue !== null && (
                  <>
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className="font-mono-numbers text-right">
                      {formatCurrency(currentValue)}
                    </span>
                  </>
                )}
                {gainLoss !== null && (
                  <>
                    <span className="text-muted-foreground">Gain/Loss:</span>
                    <span
                      className={`font-mono-numbers text-right ${
                        gainLoss >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {gainLoss >= 0 ? "+" : ""}
                      {formatCurrency(gainLoss)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit(handleAddAnother)}
              disabled={isSubmitting}
            >
              Add Another
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Add Holding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
