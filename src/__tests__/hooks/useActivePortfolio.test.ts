import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { create } from "zustand";
import { createPortfolioSlice, PortfolioSlice } from "@/stores/portfolioSlice";

const createTestStore = () => create<PortfolioSlice>()(createPortfolioSlice);

describe("useActivePortfolio", () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it("returns undefined when no portfolios exist", () => {
    const { result } = renderHook(() => useStore((state) => state.getActivePortfolio()));

    expect(result.current).toBeUndefined();
  });

  it("returns the active portfolio when one exists", () => {
    act(() => {
      useStore.getState().createPortfolio("Test Portfolio");
    });

    const { result } = renderHook(() => useStore((state) => state.getActivePortfolio()));

    expect(result.current).toBeDefined();
    expect(result.current?.name).toBe("Test Portfolio");
  });

  it("updates when active portfolio changes", () => {
    act(() => {
      useStore.getState().createPortfolio("Portfolio 1");
      useStore.getState().createPortfolio("Portfolio 2");
    });

    const portfolios = useStore.getState().portfolios;
    const portfolio2Id = portfolios[1]?.id;
    expect(portfolio2Id).toBeDefined();

    act(() => {
      useStore.getState().setActivePortfolio(portfolio2Id!);
    });

    const { result } = renderHook(() => useStore((state) => state.getActivePortfolio()));

    expect(result.current?.name).toBe("Portfolio 2");
  });

  it("returns undefined after last portfolio is deleted", () => {
    act(() => {
      useStore.getState().createPortfolio("Only Portfolio");
    });

    const portfolioId = useStore.getState().portfolios[0]?.id;
    expect(portfolioId).toBeDefined();

    act(() => {
      useStore.getState().deletePortfolio(portfolioId!);
    });

    const { result } = renderHook(() => useStore((state) => state.getActivePortfolio()));

    expect(result.current).toBeUndefined();
  });
});
