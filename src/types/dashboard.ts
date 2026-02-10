export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
}

export interface DashboardConfig {
  layouts: {
    lg: WidgetLayout[];
    md: WidgetLayout[];
    sm: WidgetLayout[];
  };
  widgets: WidgetInstance[];
  theme: "dark" | "light";
  accentColor: string;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title?: string;
  settings: Record<string, unknown>;
  addedAt: string;
}

export type WidgetType =
  | "portfolio-summary"
  | "holdings-table"
  | "allocation-chart"
  | "performance-chart"
  | "watchlist"
  | "price-chart"
  | "dividends"
  | "news-feed";

export interface SavedView {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  config: DashboardConfig;
}
