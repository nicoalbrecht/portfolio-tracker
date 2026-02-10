"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dashboard, AddWidgetModal } from "@/components/dashboard";
import { AddHoldingForm } from "@/components/portfolio/AddHoldingForm";
import { useStore } from "@/stores";
import { useQuotes } from "@/hooks";
import { Plus, RefreshCw, LayoutGrid } from "lucide-react";
import { ThemeToggle, SavedViews, PortfolioSwitcher, DataManagement } from "@/components/layout";

export default function Home() {
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });

  const symbols = portfolio?.holdings.map((h) => h.symbol) ?? [];
  const { isLoading, refetch } = useQuotes(symbols);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">ETF Portfolio</h1>
            <PortfolioSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <SavedViews />
            <DataManagement />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddWidgetOpen(true)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || symbols.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddHoldingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Holding
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Dashboard onRefresh={() => refetch()} isLoading={isLoading} />
      </main>

      <AddHoldingForm open={addHoldingOpen} onOpenChange={setAddHoldingOpen} />
      <AddWidgetModal open={addWidgetOpen} onOpenChange={setAddWidgetOpen} />
    </div>
  );
}
