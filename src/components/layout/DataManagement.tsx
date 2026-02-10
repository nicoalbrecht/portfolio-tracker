"use client";

import { useRef } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, HardDrive, Upload } from "lucide-react";
import { toast } from "sonner";

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const portfolios = useStore((state) => state.portfolios);
  const transactions = useStore((state) => state.transactions);
  const layouts = useStore((state) => state.layouts);
  const widgets = useStore((state) => state.widgets);
  const savedViews = useStore((state) => state.savedViews);
  const activePortfolioId = useStore((state) => state.activePortfolioId);
  const activeViewId = useStore((state) => state.activeViewId);
  const watchlist = useStore((state) => state.watchlist);

  const handleExport = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        portfolios,
        transactions,
        layouts,
        widgets,
        savedViews,
        activePortfolioId,
        activeViewId,
        watchlist,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etf-dashboard-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (!importData.version || !importData.data) {
          throw new Error("Invalid backup file format");
        }

        const { data } = importData;
        
        const defaultLayouts = {
          lg: [],
          md: [],
          sm: [],
        };
        
        const storeData = {
          portfolios: Array.isArray(data.portfolios) ? data.portfolios : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          layouts: data.layouts && data.layouts.lg && data.layouts.md && data.layouts.sm 
            ? data.layouts 
            : defaultLayouts,
          widgets: Array.isArray(data.widgets) ? data.widgets : [],
          savedViews: Array.isArray(data.savedViews) ? data.savedViews : [],
          activePortfolioId: data.activePortfolioId ?? null,
          activeViewId: data.activeViewId ?? null,
          watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
          theme: "dark",
        };

        localStorage.setItem("etf-dashboard-storage", JSON.stringify({ state: storeData }));
        toast.success("Data imported successfully. Refreshing...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error("Failed to import data: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Backup
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import Backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
