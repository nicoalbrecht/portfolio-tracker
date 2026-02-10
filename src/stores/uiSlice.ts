import { StateCreator } from "zustand";

const MAX_SYMBOL_LENGTH = 10;
const SYMBOL_REGEX = /^[A-Z0-9.]+$/;

/** Watchlist entry with symbol and timestamp */
export interface WatchlistItem {
  /** Stock/ETF symbol (uppercase) */
  symbol: string;
  /** ISO timestamp when added */
  addedAt: string;
}

/**
 * UI state slice for theme and watchlist management.
 */
export interface UISlice {
  /** Current color theme */
  theme: "dark" | "light";
  /** User's watchlist of tracked symbols */
  watchlist: WatchlistItem[];

  /**
   * Sets the application theme.
   * Updates the DOM classList for CSS theming.
   * @param theme - Theme to apply
   */
  setTheme: (theme: "dark" | "light") => void;

  /**
   * Toggles between dark and light themes.
   */
  toggleTheme: () => void;

  /**
   * Adds a symbol to the watchlist.
   * Symbol is uppercased and validated.
   * @param symbol - Stock/ETF symbol (max 10 chars, alphanumeric with dots)
   * @throws Error if symbol is empty, too long, or contains invalid characters
   */
  addToWatchlist: (symbol: string) => void;

  /**
   * Removes a symbol from the watchlist.
   * @param symbol - Symbol to remove (case-insensitive)
   */
  removeFromWatchlist: (symbol: string) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  theme: "dark",
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

  addToWatchlist: (symbol) => {
    const upperSymbol = symbol.trim().toUpperCase();
    
    if (!upperSymbol) {
      throw new Error("Symbol cannot be empty");
    }
    if (upperSymbol.length > MAX_SYMBOL_LENGTH) {
      throw new Error(`Symbol cannot exceed ${MAX_SYMBOL_LENGTH} characters`);
    }
    if (!SYMBOL_REGEX.test(upperSymbol)) {
      throw new Error("Symbol can only contain uppercase letters, numbers, and dots");
    }
    
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
