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
import { z } from "zod";

const importDataSchema = z.object({
  version: z.number(),
  exportedAt: z.string().optional(),
  data: z.object({
    portfolios: z.array(z.unknown()).optional(),
    transactions: z.array(z.unknown()).optional(),
    layouts: z.object({
      lg: z.array(z.unknown()),
      md: z.array(z.unknown()),
      sm: z.array(z.unknown()),
    }).optional(),
    widgets: z.array(z.unknown()).optional(),
    savedViews: z.array(z.unknown()).optional(),
    activePortfolioId: z.string().nullable().optional(),
    activeViewId: z.string().nullable().optional(),
    watchlist: z.array(z.unknown()).optional(),
    theme: z.enum(["dark", "light"]).optional(),
  }),
});

const selectExportData = (state: ReturnType<typeof useStore.getState>) => ({
  portfolios: state.portfolios,
  transactions: state.transactions,
  layouts: state.layouts,
  widgets: state.widgets,
  savedViews: state.savedViews,
  activePortfolioId: state.activePortfolioId,
  activeViewId: state.activeViewId,
  watchlist: state.watchlist,
  theme: state.theme,
});

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeData = useStore(selectExportData);
  const importState = useStore((state) => state.importState);

  const handleExport = () => {
    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: storeData,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
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
        const rawData = JSON.parse(content);

        const parsed = importDataSchema.safeParse(rawData);
        if (!parsed.success) {
          throw new Error("Invalid backup file format: " + parsed.error.message);
        }

        const { data } = parsed.data;

        importState({
          portfolios: data.portfolios,
          transactions: data.transactions,
          layouts: data.layouts,
          widgets: data.widgets,
          savedViews: data.savedViews,
          activePortfolioId: data.activePortfolioId,
          activeViewId: data.activeViewId,
          watchlist: data.watchlist,
          theme: data.theme,
        });

        toast.success("Data imported successfully");
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
