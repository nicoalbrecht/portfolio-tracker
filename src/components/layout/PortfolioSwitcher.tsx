"use client";

import { useState } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Briefcase, Check, ChevronDown, Plus, Trash2 } from "lucide-react";

export function PortfolioSwitcher() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");

  const portfolios = useStore((state) => state.portfolios);
  const activePortfolioId = useStore((state) => state.activePortfolioId);
  const createPortfolio = useStore((state) => state.createPortfolio);
  const deletePortfolio = useStore((state) => state.deletePortfolio);
  const setActivePortfolio = useStore((state) => state.setActivePortfolio);

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId);

  const handleCreatePortfolio = () => {
    if (portfolioName.trim()) {
      const id = createPortfolio(portfolioName.trim());
      setActivePortfolio(id);
      setPortfolioName("");
      setCreateDialogOpen(false);
    }
  };

  const handleDeletePortfolio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (portfolios.length > 1) {
      deletePortfolio(id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="font-semibold">{activePortfolio?.name ?? "No Portfolio"}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {portfolios.length > 0 ? (
            <>
              {portfolios.map((portfolio) => (
                <DropdownMenuItem
                  key={portfolio.id}
                  onClick={() => setActivePortfolio(portfolio.id)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {portfolio.id === activePortfolioId && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                    <span className={portfolio.id !== activePortfolioId ? "ml-5" : ""}>
                      {portfolio.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({portfolio.holdings.length} holdings)
                    </span>
                  </div>
                  {portfolios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => handleDeletePortfolio(portfolio.id, e)}
                      title="Delete portfolio"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Portfolio
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Portfolio</DialogTitle>
            <DialogDescription>
              Create a new portfolio to track a different set of holdings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Portfolio name (e.g., 'Retirement', 'Trading')"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolio} disabled={!portfolioName.trim()}>
              Create Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
