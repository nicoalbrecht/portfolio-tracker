import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createUISlice, UISlice } from "@/stores/uiSlice";

const createTestStore = () => create<UISlice>()(createUISlice);

describe("uiSlice", () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  describe("theme", () => {
    it("defaults to dark theme", () => {
      expect(useStore.getState().theme).toBe("dark");
    });

    it("setTheme changes the theme", () => {
      useStore.getState().setTheme("light");
      expect(useStore.getState().theme).toBe("light");

      useStore.getState().setTheme("dark");
      expect(useStore.getState().theme).toBe("dark");
    });

    it("toggleTheme switches between dark and light", () => {
      expect(useStore.getState().theme).toBe("dark");

      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe("light");

      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe("dark");
    });
  });

  describe("watchlist", () => {
    it("starts with empty watchlist", () => {
      expect(useStore.getState().watchlist).toEqual([]);
    });

    describe("addToWatchlist", () => {
      it("adds a symbol to watchlist", () => {
        useStore.getState().addToWatchlist("VTI");

        expect(useStore.getState().watchlist).toHaveLength(1);
        expect(useStore.getState().watchlist[0]?.symbol).toBe("VTI");
        expect(useStore.getState().watchlist[0]?.addedAt).toBeDefined();
      });

      it("converts symbol to uppercase", () => {
        useStore.getState().addToWatchlist("spy");

        expect(useStore.getState().watchlist[0]?.symbol).toBe("SPY");
      });

      it("trims whitespace from symbol", () => {
        useStore.getState().addToWatchlist("  QQQ  ");

        expect(useStore.getState().watchlist[0]?.symbol).toBe("QQQ");
      });

      it("does not add duplicate symbols", () => {
        useStore.getState().addToWatchlist("VTI");
        useStore.getState().addToWatchlist("VTI");
        useStore.getState().addToWatchlist("vti");

        expect(useStore.getState().watchlist).toHaveLength(1);
      });

      it("throws error for empty symbol", () => {
        expect(() => useStore.getState().addToWatchlist("")).toThrow("Symbol cannot be empty");
        expect(() => useStore.getState().addToWatchlist("   ")).toThrow("Symbol cannot be empty");
      });

      it("throws error for symbol exceeding 10 characters", () => {
        expect(() => useStore.getState().addToWatchlist("VERYLONGSYMBOL")).toThrow(
          "Symbol cannot exceed 10 characters"
        );
      });

      it("throws error for symbol with invalid characters", () => {
        expect(() => useStore.getState().addToWatchlist("VTI$")).toThrow(
          "Symbol can only contain uppercase letters, numbers, and dots"
        );
        expect(() => useStore.getState().addToWatchlist("VTI-A")).toThrow(
          "Symbol can only contain uppercase letters, numbers, and dots"
        );
      });

      it("allows dots in symbols", () => {
        useStore.getState().addToWatchlist("BRK.B");

        expect(useStore.getState().watchlist[0]?.symbol).toBe("BRK.B");
      });
    });

    describe("removeFromWatchlist", () => {
      beforeEach(() => {
        useStore.getState().addToWatchlist("VTI");
        useStore.getState().addToWatchlist("SPY");
        useStore.getState().addToWatchlist("QQQ");
      });

      it("removes a symbol from watchlist", () => {
        useStore.getState().removeFromWatchlist("SPY");

        expect(useStore.getState().watchlist).toHaveLength(2);
        expect(useStore.getState().watchlist.find((w) => w.symbol === "SPY")).toBeUndefined();
      });

      it("handles case-insensitive removal", () => {
        useStore.getState().removeFromWatchlist("spy");

        expect(useStore.getState().watchlist).toHaveLength(2);
        expect(useStore.getState().watchlist.find((w) => w.symbol === "SPY")).toBeUndefined();
      });

      it("does nothing when removing non-existent symbol", () => {
        useStore.getState().removeFromWatchlist("AAPL");

        expect(useStore.getState().watchlist).toHaveLength(3);
      });
    });
  });
});
