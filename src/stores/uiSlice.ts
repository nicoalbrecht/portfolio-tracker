import { StateCreator } from "zustand";

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

export interface UISlice {
  theme: "dark" | "light";
  sidebarOpen: boolean;
  activeModal: string | null;
  watchlist: WatchlistItem[];

  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  theme: "dark",
  sidebarOpen: true,
  activeModal: null,
  watchlist: [],

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  addToWatchlist: (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    set((state) => {
      if (state.watchlist.some((w) => w.symbol === upperSymbol)) {
        return state;
      }
      return {
        watchlist: [
          ...state.watchlist,
          { symbol: upperSymbol, addedAt: new Date().toISOString() },
        ],
      };
    });
  },

  removeFromWatchlist: (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    set((state) => ({
      watchlist: state.watchlist.filter((w) => w.symbol !== upperSymbol),
    }));
  },
});
