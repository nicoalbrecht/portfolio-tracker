"use client";

import { useCallback } from "react";
import { useStore } from "@/stores";
import { useQuotes, useActivePortfolio } from "@/hooks";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetWrapper } from "./WidgetWrapper";
import { WIDGET_REGISTRY, getWidgetTitle } from "@/config/widgets";
import { WidgetType } from "@/types";

interface DashboardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Dashboard({ onRefresh, isLoading = false }: DashboardProps) {
  const widgets = useStore((state) => state.widgets);
  const removeWidget = useStore((state) => state.removeWidget);
  
  const portfolio = useActivePortfolio();
  
  const symbols = portfolio?.holdings.map((h) => h.symbol) ?? [];
  const { data: quotes, isLoading: quotesLoading } = useQuotes(symbols);

  const handleRemoveWidget = useCallback((id: string) => {
    removeWidget(id);
  }, [removeWidget]);

  const showSkeleton = isLoading || quotesLoading;

  return (
    <WidgetGrid>
      {widgets.map((widget) => {
        const registryEntry = WIDGET_REGISTRY[widget.type as WidgetType];
        if (!registryEntry) return null;

        const WidgetComponent = registryEntry.component;
        const SkeletonComponent = registryEntry.skeleton;
        const title = widget.title ?? getWidgetTitle(widget.type);

        return (
          <div key={widget.id} data-grid={{ i: widget.id }}>
            <WidgetWrapper
              id={widget.id}
              title={title}
              onRemove={handleRemoveWidget}
              onRefresh={onRefresh}
              isLoading={showSkeleton}
            >
              {showSkeleton ? <SkeletonComponent /> : <WidgetComponent quotes={quotes} />}
            </WidgetWrapper>
          </div>
        );
      })}
    </WidgetGrid>
  );
}
