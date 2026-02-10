import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import { createPortfolioSlice, PortfolioSlice } from "@/stores/portfolioSlice";

const createTestStore = () => create<PortfolioSlice>()(createPortfolioSlice);

describe("portfolioSlice", () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-123");
  });

  describe("createPortfolio", () => {
    it("creates a portfolio with default USD currency", () => {
      const id = useStore.getState().createPortfolio("My Portfolio");

      expect(id).toBe("test-uuid-123");
      const state = useStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0]).toMatchObject({
        id: "test-uuid-123",
        name: "My Portfolio",
        currency: "USD",
        holdings: [],
      });
    });

    it("creates a portfolio with specified currency", () => {
      useStore.getState().createPortfolio("Euro Portfolio", "EUR");

      expect(useStore.getState().portfolios[0]?.currency).toBe("EUR");
    });

    it("sets first portfolio as active by default", () => {
      useStore.getState().createPortfolio("First Portfolio");

      expect(useStore.getState().activePortfolioId).toBe("test-uuid-123");
    });

    it("does not change active portfolio when creating second portfolio", () => {
      useStore.getState().createPortfolio("First Portfolio");

      vi.spyOn(crypto, "randomUUID").mockReturnValue("second-uuid");
      useStore.getState().createPortfolio("Second Portfolio");

      expect(useStore.getState().activePortfolioId).toBe("test-uuid-123");
    });

    it("trims whitespace from portfolio name", () => {
      useStore.getState().createPortfolio("  Trimmed Name  ");

      expect(useStore.getState().portfolios[0]?.name).toBe("Trimmed Name");
    });

    it("throws error for empty portfolio name", () => {
      expect(() => useStore.getState().createPortfolio("")).toThrow("Portfolio name cannot be empty");
      expect(() => useStore.getState().createPortfolio("   ")).toThrow("Portfolio name cannot be empty");
    });

    it("throws error for portfolio name exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      expect(() => useStore.getState().createPortfolio(longName)).toThrow("Portfolio name cannot exceed 50 characters");
    });

    it("throws error for portfolio name with invalid characters", () => {
      expect(() => useStore.getState().createPortfolio("Portfolio @#$")).toThrow(
        "Portfolio name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    });

    it("allows valid special characters in portfolio name", () => {
      useStore.getState().createPortfolio("My-Portfolio_2024");

      expect(useStore.getState().portfolios[0]?.name).toBe("My-Portfolio_2024");
    });
  });

  describe("deletePortfolio", () => {
    it("deletes a portfolio by ID", () => {
      useStore.getState().createPortfolio("Portfolio to Delete");

      useStore.getState().deletePortfolio("test-uuid-123");

      expect(useStore.getState().portfolios).toHaveLength(0);
    });

    it("switches to another portfolio when active portfolio is deleted", () => {
      useStore.getState().createPortfolio("First");

      vi.spyOn(crypto, "randomUUID").mockReturnValue("second-uuid");
      useStore.getState().createPortfolio("Second");

      useStore.getState().setActivePortfolio("test-uuid-123");
      useStore.getState().deletePortfolio("test-uuid-123");

      expect(useStore.getState().activePortfolioId).toBe("second-uuid");
    });

    it("sets activePortfolioId to null when last portfolio is deleted", () => {
      useStore.getState().createPortfolio("Only Portfolio");
      useStore.getState().deletePortfolio("test-uuid-123");

      expect(useStore.getState().activePortfolioId).toBeNull();
    });

    it("does not change activePortfolioId when non-active portfolio is deleted", () => {
      useStore.getState().createPortfolio("First");

      vi.spyOn(crypto, "randomUUID").mockReturnValue("second-uuid");
      useStore.getState().createPortfolio("Second");

      useStore.getState().deletePortfolio("second-uuid");

      expect(useStore.getState().activePortfolioId).toBe("test-uuid-123");
    });
  });

  describe("setActivePortfolio", () => {
    it("sets the active portfolio ID", () => {
      useStore.getState().createPortfolio("First");

      vi.spyOn(crypto, "randomUUID").mockReturnValue("second-uuid");
      useStore.getState().createPortfolio("Second");

      useStore.getState().setActivePortfolio("second-uuid");

      expect(useStore.getState().activePortfolioId).toBe("second-uuid");
    });
  });

  describe("getActivePortfolio", () => {
    it("returns the active portfolio", () => {
      useStore.getState().createPortfolio("Active Portfolio");

      const active = useStore.getState().getActivePortfolio();

      expect(active).toMatchObject({
        id: "test-uuid-123",
        name: "Active Portfolio",
      });
    });

    it("returns undefined when no active portfolio", () => {
      const active = useStore.getState().getActivePortfolio();
      expect(active).toBeUndefined();
    });
  });

  describe("addHolding", () => {
    beforeEach(() => {
      useStore.getState().createPortfolio("Test Portfolio");
    });

    it("adds a holding to the active portfolio", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("holding-uuid");

      const holdingId = useStore.getState().addHolding({
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
        purchaseDate: "2024-01-15",
      });

      expect(holdingId).toBe("holding-uuid");

      const portfolio = useStore.getState().getActivePortfolio();
      expect(portfolio?.holdings).toHaveLength(1);
      expect(portfolio?.holdings[0]).toMatchObject({
        id: "holding-uuid",
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
      });
    });

    it("sets createdAt and updatedAt timestamps", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("holding-uuid");

      useStore.getState().addHolding({
        symbol: "SPY",
        name: "SPDR S&P 500",
        shares: 50,
        avgCostBasis: 450,
        purchaseDate: "2024-01-15",
      });

      const portfolio = useStore.getState().getActivePortfolio();
      const holding = portfolio?.holdings[0];

      expect(holding?.createdAt).toBeDefined();
      expect(holding?.updatedAt).toBeDefined();
      expect(holding?.createdAt).toBe(holding?.updatedAt);
    });
  });

  describe("updateHolding", () => {
    beforeEach(() => {
      useStore.getState().createPortfolio("Test Portfolio");
      vi.spyOn(crypto, "randomUUID").mockReturnValue("holding-uuid");
      useStore.getState().addHolding({
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
        purchaseDate: "2024-01-15",
      });
    });

    it("updates holding fields", () => {
      useStore.getState().updateHolding("holding-uuid", { shares: 150, avgCostBasis: 210 });

      const portfolio = useStore.getState().getActivePortfolio();
      expect(portfolio?.holdings[0]).toMatchObject({
        shares: 150,
        avgCostBasis: 210,
      });
    });

    it("updates the updatedAt timestamp", () => {
      const beforeUpdate = useStore.getState().getActivePortfolio()?.holdings[0]?.updatedAt;

      useStore.getState().updateHolding("holding-uuid", { shares: 200 });

      const afterUpdate = useStore.getState().getActivePortfolio()?.holdings[0]?.updatedAt;
      expect(afterUpdate).toBeDefined();
      expect(new Date(afterUpdate!).getTime()).toBeGreaterThanOrEqual(new Date(beforeUpdate!).getTime());
    });
  });

  describe("deleteHolding", () => {
    beforeEach(() => {
      useStore.getState().createPortfolio("Test Portfolio");
      vi.spyOn(crypto, "randomUUID").mockReturnValue("holding-uuid");
      useStore.getState().addHolding({
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
        purchaseDate: "2024-01-15",
      });
    });

    it("removes the holding from the portfolio", () => {
      useStore.getState().deleteHolding("holding-uuid");

      const portfolio = useStore.getState().getActivePortfolio();
      expect(portfolio?.holdings).toHaveLength(0);
    });

    it("removes associated transactions", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("transaction-uuid");
      useStore.getState().addTransaction({
        holdingId: "holding-uuid",
        type: "BUY",
        shares: 100,
        pricePerShare: 200.5,
        date: "2024-01-15",
      });

      expect(useStore.getState().transactions).toHaveLength(1);

      useStore.getState().deleteHolding("holding-uuid");

      expect(useStore.getState().transactions).toHaveLength(0);
    });
  });

  describe("addTransaction", () => {
    it("adds a transaction", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("transaction-uuid");

      useStore.getState().addTransaction({
        holdingId: "holding-123",
        type: "BUY",
        shares: 100,
        pricePerShare: 200.5,
        date: "2024-01-15",
      });

      expect(useStore.getState().transactions).toHaveLength(1);
      expect(useStore.getState().transactions[0]).toMatchObject({
        id: "transaction-uuid",
        holdingId: "holding-123",
        type: "BUY",
        shares: 100,
        pricePerShare: 200.5,
      });
    });
  });
});
