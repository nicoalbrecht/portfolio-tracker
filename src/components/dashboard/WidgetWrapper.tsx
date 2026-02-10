"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, Settings, X, RefreshCw, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function WidgetWrapper({
  id,
  title,
  children,
  onRemove,
  onRefresh,
  onSettings,
  isLoading = false,
  className,
}: WidgetWrapperProps) {
  return (
    <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Widget options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
              {onRemove && (
                <DropdownMenuItem
                  onClick={() => onRemove(id)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4">
        {children}
      </CardContent>
    </Card>
  );
}
