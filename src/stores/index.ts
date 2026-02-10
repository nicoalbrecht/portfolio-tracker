import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPortfolioSlice, PortfolioSlice } from "./portfolioSlice";
import { createDashboardSlice, DashboardSlice } from "./dashboardSlice";
import { createUISlice, UISlice } from "./uiSlice";

export type StoreState = PortfolioSlice & DashboardSlice & UISlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createPortfolioSlice(...a),
      ...createDashboardSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: "etf-dashboard-storage",
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
    }
  )
);

export { type PortfolioSlice } from "./portfolioSlice";
export { type DashboardSlice } from "./dashboardSlice";
export { type UISlice } from "./uiSlice";
