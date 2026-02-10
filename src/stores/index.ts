import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPortfolioSlice, PortfolioSlice } from "./portfolioSlice";
import { createDashboardSlice, DashboardSlice } from "./dashboardSlice";
import { createUISlice, UISlice } from "./uiSlice";

const STORE_VERSION = 1;

interface ImportableState {
  portfolios?: unknown[];
  activePortfolioId?: string | null;
  transactions?: unknown[];
  layouts?: { lg?: unknown[]; md?: unknown[]; sm?: unknown[] };
  widgets?: unknown[];
  savedViews?: unknown[];
  activeViewId?: string | null;
  theme?: "dark" | "light";
  watchlist?: unknown[];
}

interface StoreActions {
  importState: (state: ImportableState) => void;
  resetStore: () => void;
}

export type StoreState = PortfolioSlice & DashboardSlice & UISlice & StoreActions;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createPortfolioSlice(...a),
      ...createDashboardSlice(...a),
      ...createUISlice(...a),

      importState: (importedState: ImportableState) => {
        const [set] = a;
        set((currentState) => {
          const newState: Partial<StoreState> = {};

          if (Array.isArray(importedState.portfolios)) {
            newState.portfolios = importedState.portfolios as StoreState["portfolios"];
          }
          if (importedState.activePortfolioId !== undefined) {
            newState.activePortfolioId = importedState.activePortfolioId;
          }
          if (Array.isArray(importedState.transactions)) {
            newState.transactions = importedState.transactions as StoreState["transactions"];
          }
          if (
            importedState.layouts &&
            Array.isArray(importedState.layouts.lg) &&
            Array.isArray(importedState.layouts.md) &&
            Array.isArray(importedState.layouts.sm)
          ) {
            newState.layouts = importedState.layouts as StoreState["layouts"];
          }
          if (Array.isArray(importedState.widgets)) {
            newState.widgets = importedState.widgets as StoreState["widgets"];
          }
          if (Array.isArray(importedState.savedViews)) {
            newState.savedViews = importedState.savedViews as StoreState["savedViews"];
          }
          if (importedState.activeViewId !== undefined) {
            newState.activeViewId = importedState.activeViewId;
          }
          if (importedState.theme === "dark" || importedState.theme === "light") {
            newState.theme = importedState.theme;
            if (typeof document !== "undefined") {
              document.documentElement.classList.toggle("dark", importedState.theme === "dark");
            }
          }
          if (Array.isArray(importedState.watchlist)) {
            newState.watchlist = importedState.watchlist as StoreState["watchlist"];
          }

          return { ...currentState, ...newState };
        });
      },

      resetStore: () => {
        const [set] = a;
        set({
          portfolios: [],
          activePortfolioId: null,
          transactions: [],
          layouts: { lg: [], md: [], sm: [] },
          widgets: [],
          savedViews: [],
          activeViewId: null,
          watchlist: [],
        });
      },
    }),
    {
      name: "etf-dashboard-storage",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        portfolios: state.portfolios,
        activePortfolioId: state.activePortfolioId,
        transactions: state.transactions,
        layouts: state.layouts,
        widgets: state.widgets,
        savedViews: state.savedViews,
        activeViewId: state.activeViewId,
        theme: state.theme,
        watchlist: state.watchlist,
      }),
      migrate: (persistedState, version) => {
        if (version === 0) {
          return persistedState as StoreState;
        }
        return persistedState as StoreState;
      },
      onRehydrateStorage: () => (state) => {
        // Sync theme with DOM on hydration
        if (state?.theme && typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
        }
      },
    }
  )
);

export { type PortfolioSlice } from "./portfolioSlice";
export { type DashboardSlice } from "./dashboardSlice";
export { type UISlice } from "./uiSlice";
