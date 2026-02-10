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
import { Bookmark, Check, Plus, Star, Trash2 } from "lucide-react";

export function SavedViews() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");

  const savedViews = useStore((state) => state.savedViews);
  const activeViewId = useStore((state) => state.activeViewId);
  const saveView = useStore((state) => state.saveView);
  const loadView = useStore((state) => state.loadView);
  const deleteView = useStore((state) => state.deleteView);
  const setDefaultView = useStore((state) => state.setDefaultView);
  const resetToDefaults = useStore((state) => state.resetToDefaults);

  const activeView = savedViews.find((v) => v.id === activeViewId);

  const handleSaveView = () => {
    if (viewName.trim()) {
      saveView(viewName.trim());
      setViewName("");
      setSaveDialogOpen(false);
    }
  };

  const handleDeleteView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteView(id);
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultView(id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            {activeView?.name ?? "Views"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {savedViews.length > 0 ? (
            <>
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => loadView(view.id)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {view.id === activeViewId && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                    <span className={view.id !== activeViewId ? "ml-5" : ""}>
                      {view.name}
                    </span>
                    {view.isDefault && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!view.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleSetDefault(view.id, e)}
                        title="Set as default"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteView(view.id, e)}
                      title="Delete view"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No saved views</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={resetToDefaults}>
            Reset to Defaults
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
            <DialogDescription>
              Save your current dashboard layout and widgets as a named view.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="View name (e.g., 'Trading View', 'Overview')"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveView()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={!viewName.trim()}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
