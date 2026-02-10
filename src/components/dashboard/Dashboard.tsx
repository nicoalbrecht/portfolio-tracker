"use client";

import { useStore } from "@/stores";
import { useQuotes } from "@/hooks";
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
  
  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });
  
  const symbols = portfolio?.holdings.map((h) => h.symbol) ?? [];
  const { data: quotes } = useQuotes(symbols);

  const handleRemoveWidget = (id: string) => {
    removeWidget(id);
  };

  return (
    <WidgetGrid>
      {widgets.map((widget) => {
        const registryEntry = WIDGET_REGISTRY[widget.type as WidgetType];
        if (!registryEntry) return null;

        const WidgetComponent = registryEntry.component;
        const title = widget.title ?? getWidgetTitle(widget.type);

        return (
          <div key={widget.id} data-grid={{ i: widget.id }}>
            <WidgetWrapper
              id={widget.id}
              title={title}
              onRemove={handleRemoveWidget}
              onRefresh={onRefresh}
              isLoading={isLoading}
            >
              <WidgetComponent widgetId={widget.id} quotes={quotes} />
            </WidgetWrapper>
          </div>
        );
      })}
    </WidgetGrid>
  );
}
