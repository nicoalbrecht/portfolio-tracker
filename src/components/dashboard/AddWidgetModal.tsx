"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores";
import { WIDGET_REGISTRY } from "@/config/widgets";
import { WidgetType } from "@/types";
import { cn } from "@/lib/utils";

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWidgetModal({ open, onOpenChange }: AddWidgetModalProps) {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const addWidget = useStore((state) => state.addWidget);
  const existingWidgets = useStore((state) => state.widgets);

  const handleAdd = () => {
    if (selectedType) {
      addWidget(selectedType);
      setSelectedType(null);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const widgetEntries = Object.entries(WIDGET_REGISTRY) as [WidgetType, typeof WIDGET_REGISTRY[WidgetType]][];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {widgetEntries.map(([type, entry]) => {
            const Icon = entry.icon;
            const isDisabled = !entry.available;
            const alreadyExists = existingWidgets.some((w) => w.type === type);

            return (
              <button
                key={type}
                onClick={() => !isDisabled && setSelectedType(type)}
                disabled={isDisabled}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-colors",
                  "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                  selectedType === type && "border-primary bg-muted",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  alreadyExists && "border-dashed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">{entry.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {entry.description}
                </p>
                {alreadyExists && (
                  <span className="text-xs text-muted-foreground italic">
                    Already added
                  </span>
                )}
                {isDisabled && (
                  <span className="text-xs text-muted-foreground italic">
                    Coming soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedType}>
            Add Widget
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
