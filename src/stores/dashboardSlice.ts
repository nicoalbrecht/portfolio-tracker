import { StateCreator } from "zustand";
import { DashboardConfig, WidgetInstance, WidgetLayout, SavedView } from "@/types";
import { UISlice } from "./uiSlice";

const MAX_VIEW_NAME_LENGTH = 50;
const VIEW_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

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

const getDefaultWidgets = (): WidgetInstance[] => [
  { id: "portfolio-summary", type: "portfolio-summary", settings: {}, addedAt: new Date().toISOString() },
  { id: "allocation-chart", type: "allocation-chart", settings: {}, addedAt: new Date().toISOString() },
  { id: "holdings-table", type: "holdings-table", settings: {}, addedAt: new Date().toISOString() },
];

/**
 * Dashboard layout and widget management slice.
 * Handles responsive layouts, widget instances, and saved view configurations.
 */
export interface DashboardSlice {
  /** Responsive grid layouts for lg/md/sm breakpoints */
  layouts: DashboardConfig["layouts"];
  /** Active widget instances on the dashboard */
  widgets: WidgetInstance[];
  /** User-saved dashboard view configurations */
  savedViews: SavedView[];
  /** Currently loaded saved view ID */
  activeViewId: string | null;

  /**
   * Updates all responsive layouts (lg, md, sm).
   * Called by react-grid-layout on drag/resize.
   * @param layouts - New layouts for all breakpoints
   */
  updateLayouts: (layouts: DashboardConfig["layouts"]) => void;

  /**
   * Adds a new widget to the dashboard.
   * Automatically positions it and creates layout entries for all breakpoints.
   * @param type - Widget type from registry (e.g., "portfolio-summary")
   * @param settings - Optional widget-specific settings
   */
  addWidget: (type: WidgetInstance["type"], settings?: Record<string, unknown>) => void;

  /**
   * Removes a widget from the dashboard.
   * @param id - Widget instance ID
   */
  removeWidget: (id: string) => void;

  /**
   * Updates settings for a specific widget.
   * @param id - Widget instance ID
   * @param settings - Settings to merge with existing
   */
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void;

  /**
   * Saves current layout and widgets as a named view.
   * @param name - View name (max 50 chars, alphanumeric with spaces/hyphens/underscores)
   * @returns The new view's ID
   * @throws Error if name is empty, too long, or contains invalid characters
   */
  saveView: (name: string) => string;

  /**
   * Loads a saved view, replacing current layouts and widgets.
   * @param id - Saved view ID
   */
  loadView: (id: string) => void;

  /**
   * Deletes a saved view.
   * If it was the default, promotes another view to default.
   * @param id - Saved view ID
   */
  deleteView: (id: string) => void;

  /**
   * Sets a view as the default (loaded on startup).
   * @param id - Saved view ID
   */
  setDefaultView: (id: string) => void;

  /**
   * Resets layouts and widgets to factory defaults.
   */
  resetToDefaults: () => void;
}

export const createDashboardSlice: StateCreator<DashboardSlice & UISlice, [], [], DashboardSlice> = (set, get) => ({
  layouts: DEFAULT_LAYOUTS,
  widgets: getDefaultWidgets(),
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
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      throw new Error("View name cannot be empty");
    }
    if (trimmedName.length > MAX_VIEW_NAME_LENGTH) {
      throw new Error(`View name cannot exceed ${MAX_VIEW_NAME_LENGTH} characters`);
    }
    if (!VIEW_NAME_REGEX.test(trimmedName)) {
      throw new Error("View name can only contain letters, numbers, spaces, hyphens, and underscores");
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { layouts, widgets, savedViews, theme } = get();

    const newView: SavedView = {
      id,
      name: trimmedName,
      isDefault: savedViews.length === 0,
      createdAt: now,
      updatedAt: now,
      config: {
        layouts: structuredClone(layouts),
        widgets: structuredClone(widgets),
        theme,
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
          layouts: structuredClone(layouts),
          widgets: structuredClone(widgets),
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
      widgets: getDefaultWidgets(),
    });
  },
});
