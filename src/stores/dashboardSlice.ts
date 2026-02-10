import { StateCreator } from "zustand";
import { DashboardConfig, WidgetInstance, WidgetLayout, SavedView } from "@/types";

const DEFAULT_LAYOUTS: DashboardConfig["layouts"] = {
  lg: [
    { i: "portfolio-summary", x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    { i: "allocation-chart", x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "holdings-table", x: 0, y: 2, w: 8, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: "portfolio-summary", x: 0, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: "allocation-chart", x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "holdings-table", x: 0, y: 2, w: 10, h: 4, minW: 6, minH: 3 },
  ],
  sm: [
    { i: "portfolio-summary", x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: "allocation-chart", x: 0, y: 2, w: 6, h: 4, minW: 3, minH: 3 },
    { i: "holdings-table", x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
  ],
};

const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: "portfolio-summary", type: "portfolio-summary", settings: {}, addedAt: new Date().toISOString() },
  { id: "allocation-chart", type: "allocation-chart", settings: {}, addedAt: new Date().toISOString() },
  { id: "holdings-table", type: "holdings-table", settings: {}, addedAt: new Date().toISOString() },
];

export interface DashboardSlice {
  layouts: DashboardConfig["layouts"];
  widgets: WidgetInstance[];
  savedViews: SavedView[];
  activeViewId: string | null;

  updateLayouts: (layouts: DashboardConfig["layouts"]) => void;
  addWidget: (type: WidgetInstance["type"], settings?: Record<string, unknown>) => void;
  removeWidget: (id: string) => void;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void;

  saveView: (name: string) => string;
  loadView: (id: string) => void;
  deleteView: (id: string) => void;
  setDefaultView: (id: string) => void;
  resetToDefaults: () => void;
}

export const createDashboardSlice: StateCreator<DashboardSlice> = (set, get) => ({
  layouts: DEFAULT_LAYOUTS,
  widgets: DEFAULT_WIDGETS,
  savedViews: [],
  activeViewId: null,

  updateLayouts: (layouts) => {
    set({ layouts });
  },

  addWidget: (type, settings = {}) => {
    const id = `${type}-${crypto.randomUUID().slice(0, 8)}`;
    const newWidget: WidgetInstance = {
      id,
      type,
      settings,
      addedAt: new Date().toISOString(),
    };

    const defaultSizes: Record<string, { w: number; h: number; minW: number; minH: number }> = {
      "portfolio-summary": { w: 4, h: 2, minW: 3, minH: 2 },
      "holdings-table": { w: 8, h: 4, minW: 6, minH: 3 },
      "allocation-chart": { w: 4, h: 4, minW: 3, minH: 3 },
      "performance-chart": { w: 8, h: 4, minW: 4, minH: 3 },
      "price-chart": { w: 6, h: 4, minW: 4, minH: 3 },
      watchlist: { w: 4, h: 4, minW: 3, minH: 3 },
      dividends: { w: 4, h: 3, minW: 3, minH: 2 },
    };

    const size = defaultSizes[type] ?? { w: 4, h: 4, minW: 2, minH: 2 };
    const newLayoutItem: WidgetLayout = { i: id, x: 0, y: Infinity, ...size };

    set((state) => ({
      widgets: [...state.widgets, newWidget],
      layouts: {
        lg: [...state.layouts.lg, newLayoutItem],
        md: [...state.layouts.md, newLayoutItem],
        sm: [...state.layouts.sm, newLayoutItem],
      },
    }));
  },

  removeWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
      layouts: {
        lg: state.layouts.lg.filter((l) => l.i !== id),
        md: state.layouts.md.filter((l) => l.i !== id),
        sm: state.layouts.sm.filter((l) => l.i !== id),
      },
    }));
  },

  updateWidgetSettings: (id, settings) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w
      ),
    }));
  },

  saveView: (name) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { layouts, widgets, savedViews } = get();

    const newView: SavedView = {
      id,
      name,
      isDefault: savedViews.length === 0,
      createdAt: now,
      updatedAt: now,
      config: {
        layouts: JSON.parse(JSON.stringify(layouts)),
        widgets: JSON.parse(JSON.stringify(widgets)),
        theme: "dark",
        accentColor: "emerald",
      },
    };

    set((state) => ({
      savedViews: [...state.savedViews, newView],
      activeViewId: id,
    }));
    return id;
  },

  loadView: (id) => {
    const { savedViews } = get();
    const view = savedViews.find((v) => v.id === id);
    if (view && view.config?.layouts && view.config?.widgets) {
      const { layouts, widgets } = view.config;
      if (layouts.lg && layouts.md && layouts.sm && Array.isArray(widgets)) {
        set({
          layouts: JSON.parse(JSON.stringify(layouts)),
          widgets: JSON.parse(JSON.stringify(widgets)),
          activeViewId: id,
        });
      }
    }
  },

  deleteView: (id) => {
    set((state) => {
      const filtered = state.savedViews.filter((v) => v.id !== id);
      const needsNewDefault = filtered.length > 0 && filtered.every((v) => !v.isDefault);
      
      const updatedViews = needsNewDefault
        ? filtered.map((v, i) => (i === 0 ? { ...v, isDefault: true } : v))
        : filtered;
        
      return {
        savedViews: updatedViews,
        activeViewId: state.activeViewId === id ? updatedViews[0]?.id ?? null : state.activeViewId,
      };
    });
  },

  setDefaultView: (id) => {
    set((state) => ({
      savedViews: state.savedViews.map((v) => ({
        ...v,
        isDefault: v.id === id,
      })),
    }));
  },

  resetToDefaults: () => {
    set({
      layouts: DEFAULT_LAYOUTS,
      widgets: DEFAULT_WIDGETS,
    });
  },
});
