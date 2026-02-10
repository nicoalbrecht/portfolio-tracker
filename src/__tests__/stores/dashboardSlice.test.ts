import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import { createDashboardSlice, DashboardSlice } from "@/stores/dashboardSlice";
import { createUISlice, UISlice } from "@/stores/uiSlice";

type CombinedSlice = DashboardSlice & UISlice;

const createTestStore = () =>
  create<CombinedSlice>()((...a) => ({
    ...createDashboardSlice(...a),
    ...createUISlice(...a),
  }));

describe("dashboardSlice", () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-12345678");
  });

  describe("initial state", () => {
    it("has default layouts for lg, md, sm breakpoints", () => {
      const { layouts } = useStore.getState();

      expect(layouts.lg).toBeDefined();
      expect(layouts.md).toBeDefined();
      expect(layouts.sm).toBeDefined();
      expect(layouts.lg.length).toBeGreaterThan(0);
    });

    it("has default widgets", () => {
      const { widgets } = useStore.getState();

      expect(widgets.length).toBe(3);
      expect(widgets.map((w) => w.type)).toContain("portfolio-summary");
      expect(widgets.map((w) => w.type)).toContain("allocation-chart");
      expect(widgets.map((w) => w.type)).toContain("holdings-table");
    });
  });

  describe("updateLayouts", () => {
    it("updates all layouts", () => {
      const newLayouts = {
        lg: [{ i: "test", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }],
        md: [{ i: "test", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }],
        sm: [{ i: "test", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }],
      };

      useStore.getState().updateLayouts(newLayouts);

      expect(useStore.getState().layouts).toEqual(newLayouts);
    });
  });

  describe("addWidget", () => {
    it("adds a widget with correct type", () => {
      const initialCount = useStore.getState().widgets.length;

      useStore.getState().addWidget("watchlist");

      expect(useStore.getState().widgets.length).toBe(initialCount + 1);
      const addedWidget = useStore.getState().widgets[useStore.getState().widgets.length - 1];
      expect(addedWidget?.type).toBe("watchlist");
    });

    it("generates unique widget ID", () => {
      useStore.getState().addWidget("price-chart");

      const addedWidget = useStore.getState().widgets[useStore.getState().widgets.length - 1];
      expect(addedWidget?.id).toContain("price-chart-");
    });

    it("adds layout entries for all breakpoints", () => {
      const initialLgCount = useStore.getState().layouts.lg.length;

      useStore.getState().addWidget("performance-chart");

      expect(useStore.getState().layouts.lg.length).toBe(initialLgCount + 1);
      expect(useStore.getState().layouts.md.length).toBe(initialLgCount + 1);
      expect(useStore.getState().layouts.sm.length).toBe(initialLgCount + 1);
    });

    it("accepts custom settings", () => {
      useStore.getState().addWidget("price-chart", { timeframe: "1M" });

      const addedWidget = useStore.getState().widgets[useStore.getState().widgets.length - 1];
      expect(addedWidget?.settings).toEqual({ timeframe: "1M" });
    });
  });

  describe("removeWidget", () => {
    it("removes widget from widgets array", () => {
      const widgetId = useStore.getState().widgets[0]?.id;
      const initialCount = useStore.getState().widgets.length;

      if (widgetId) {
        useStore.getState().removeWidget(widgetId);
      }

      expect(useStore.getState().widgets.length).toBe(initialCount - 1);
      expect(useStore.getState().widgets.find((w) => w.id === widgetId)).toBeUndefined();
    });

    it("removes widget from all layout breakpoints", () => {
      const widgetId = useStore.getState().widgets[0]?.id;

      if (widgetId) {
        useStore.getState().removeWidget(widgetId);
      }

      expect(useStore.getState().layouts.lg.find((l) => l.i === widgetId)).toBeUndefined();
      expect(useStore.getState().layouts.md.find((l) => l.i === widgetId)).toBeUndefined();
      expect(useStore.getState().layouts.sm.find((l) => l.i === widgetId)).toBeUndefined();
    });
  });

  describe("updateWidgetSettings", () => {
    it("updates settings for specific widget", () => {
      useStore.getState().addWidget("price-chart", { timeframe: "1D" });
      const widgetId = useStore.getState().widgets[useStore.getState().widgets.length - 1]?.id;

      if (widgetId) {
        useStore.getState().updateWidgetSettings(widgetId, { timeframe: "1W" });
      }

      const widget = useStore.getState().widgets.find((w) => w.id === widgetId);
      expect(widget?.settings).toEqual({ timeframe: "1W" });
    });

    it("merges with existing settings", () => {
      useStore.getState().addWidget("price-chart", { timeframe: "1D", symbol: "VTI" });
      const widgetId = useStore.getState().widgets[useStore.getState().widgets.length - 1]?.id;

      if (widgetId) {
        useStore.getState().updateWidgetSettings(widgetId, { timeframe: "1W" });
      }

      const widget = useStore.getState().widgets.find((w) => w.id === widgetId);
      expect(widget?.settings).toEqual({ timeframe: "1W", symbol: "VTI" });
    });
  });

  describe("saveView", () => {
    it("saves current state as a view", () => {
      const viewId = useStore.getState().saveView("My View");

      expect(viewId).toBe("test-uuid-12345678");
      expect(useStore.getState().savedViews).toHaveLength(1);
      expect(useStore.getState().savedViews[0]?.name).toBe("My View");
    });

    it("sets first view as default", () => {
      useStore.getState().saveView("First View");

      expect(useStore.getState().savedViews[0]?.isDefault).toBe(true);
    });

    it("sets activeViewId to new view", () => {
      useStore.getState().saveView("Active View");

      expect(useStore.getState().activeViewId).toBe("test-uuid-12345678");
    });

    it("throws error for empty view name", () => {
      expect(() => useStore.getState().saveView("")).toThrow("View name cannot be empty");
    });

    it("throws error for view name exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      expect(() => useStore.getState().saveView(longName)).toThrow(
        "View name cannot exceed 50 characters"
      );
    });

    it("throws error for view name with invalid characters", () => {
      expect(() => useStore.getState().saveView("My View @#$")).toThrow(
        "View name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    });
  });

  describe("loadView", () => {
    beforeEach(() => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("view-uuid");
      useStore.getState().saveView("Saved View");
    });

    it("loads layouts and widgets from saved view", () => {
      useStore.getState().addWidget("watchlist");
      useStore.getState().loadView("view-uuid");

      expect(useStore.getState().activeViewId).toBe("view-uuid");
    });
  });

  describe("deleteView", () => {
    beforeEach(() => {
      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("view-1").mockReturnValueOnce("view-2");
      useStore.getState().saveView("View 1");
      useStore.getState().saveView("View 2");
    });

    it("removes view from savedViews", () => {
      useStore.getState().deleteView("view-1");

      expect(useStore.getState().savedViews.find((v) => v.id === "view-1")).toBeUndefined();
      expect(useStore.getState().savedViews).toHaveLength(1);
    });

    it("promotes another view to default if default is deleted", () => {
      useStore.getState().deleteView("view-1");

      expect(useStore.getState().savedViews[0]?.isDefault).toBe(true);
    });
  });

  describe("setDefaultView", () => {
    beforeEach(() => {
      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("view-1").mockReturnValueOnce("view-2");
      useStore.getState().saveView("View 1");
      useStore.getState().saveView("View 2");
    });

    it("sets specified view as default", () => {
      useStore.getState().setDefaultView("view-2");

      expect(useStore.getState().savedViews.find((v) => v.id === "view-2")?.isDefault).toBe(true);
      expect(useStore.getState().savedViews.find((v) => v.id === "view-1")?.isDefault).toBe(false);
    });
  });

  describe("resetToDefaults", () => {
    it("resets layouts and widgets to defaults", () => {
      useStore.getState().addWidget("watchlist");
      useStore.getState().addWidget("price-chart");
      useStore.getState().removeWidget(useStore.getState().widgets[0]?.id ?? "");

      useStore.getState().resetToDefaults();

      expect(useStore.getState().widgets).toHaveLength(3);
      expect(useStore.getState().widgets.map((w) => w.type)).toContain("portfolio-summary");
    });
  });
});
