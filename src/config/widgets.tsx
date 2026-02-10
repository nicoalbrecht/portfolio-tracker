import { ComponentType } from "react";
import {
  DollarSign,
  Table as TableIcon,
  PieChart,
  TrendingUp,
  Eye,
  CandlestickChart,
  Coins,
  Newspaper,
  LucideIcon,
} from "lucide-react";
import { WidgetType, Quote } from "@/types";
import { 
  PortfolioSummary, 
  HoldingsTable,
  AllocationChart,
  PerformanceChart,
  PriceChart,
  Watchlist,
} from "@/components/widgets";

export interface WidgetRegistryEntry {
  component: ComponentType<{ widgetId: string; quotes?: Record<string, Quote> }>;
  title: string;
  icon: LucideIcon;
  defaultSize: { w: number; h: number; minW: number; minH: number };
  description: string;
  available: boolean;
}

function PlaceholderWidget({ title }: { title: string; widgetId: string }) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p className="text-sm">{title} - Coming Soon</p>
    </div>
  );
}

const WatchlistWidget = () => (
  <Watchlist />
);
const DividendsWidget = ({ widgetId }: { widgetId: string }) => (
  <PlaceholderWidget title="Dividends" widgetId={widgetId} />
);
const NewsFeed = ({ widgetId }: { widgetId: string }) => (
  <PlaceholderWidget title="News Feed" widgetId={widgetId} />
);

const PortfolioSummaryWidget = ({ quotes }: { widgetId: string; quotes?: Record<string, Quote> }) => (
  <PortfolioSummary quotes={quotes} />
);

const HoldingsTableWidget = ({ quotes }: { widgetId: string; quotes?: Record<string, Quote> }) => (
  <HoldingsTable quotes={quotes} />
);

const AllocationChartWidget = ({ quotes }: { widgetId: string; quotes?: Record<string, Quote> }) => (
  <AllocationChart quotes={quotes} />
);

const PerformanceChartWidget = ({ quotes }: { widgetId: string; quotes?: Record<string, Quote> }) => (
  <PerformanceChart quotes={quotes} />
);

const PriceChartWidget = ({ quotes }: { widgetId: string; quotes?: Record<string, Quote> }) => (
  <PriceChart quotes={quotes} />
);

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  "portfolio-summary": {
    component: PortfolioSummaryWidget,
    title: "Portfolio Summary",
    icon: DollarSign,
    defaultSize: { w: 4, h: 2, minW: 3, minH: 2 },
    description: "Total value, daily change, and overall gain/loss",
    available: true,
  },
  "holdings-table": {
    component: HoldingsTableWidget,
    title: "Holdings",
    icon: TableIcon,
    defaultSize: { w: 8, h: 4, minW: 6, minH: 3 },
    description: "Your ETF positions with current values",
    available: true,
  },
  "allocation-chart": {
    component: AllocationChartWidget,
    title: "Allocation",
    icon: PieChart,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    description: "Portfolio breakdown by holding",
    available: true,
  },
  "performance-chart": {
    component: PerformanceChartWidget,
    title: "Performance",
    icon: TrendingUp,
    defaultSize: { w: 8, h: 4, minW: 4, minH: 3 },
    description: "Portfolio value over time",
    available: true,
  },
  watchlist: {
    component: WatchlistWidget,
    title: "Watchlist",
    icon: Eye,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    description: "Track ETFs you're interested in",
    available: true,
  },
  "price-chart": {
    component: PriceChartWidget,
    title: "Price Chart",
    icon: CandlestickChart,
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3 },
    description: "Detailed price chart for a symbol",
    available: true,
  },
  dividends: {
    component: DividendsWidget,
    title: "Dividends",
    icon: Coins,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    description: "Dividend income tracking",
    available: false,
  },
  "news-feed": {
    component: NewsFeed,
    title: "News Feed",
    icon: Newspaper,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    description: "Latest ETF and market news",
    available: false,
  },
};

export function getWidgetComponent(type: WidgetType) {
  return WIDGET_REGISTRY[type]?.component;
}

export function getWidgetTitle(type: WidgetType) {
  return WIDGET_REGISTRY[type]?.title ?? type;
}

export function getAvailableWidgetTypes(): WidgetType[] {
  return Object.entries(WIDGET_REGISTRY)
    .filter(([, entry]) => entry.available)
    .map(([type]) => type as WidgetType);
}

export function getAllWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[];
}
