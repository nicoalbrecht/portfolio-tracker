import { StateCreator } from "zustand";
import { Portfolio, Holding, Transaction } from "@/types";

/**
 * Portfolio management slice for Zustand store.
 * Handles portfolios, holdings, and transaction state.
 */
export interface PortfolioSlice {
  /** All user portfolios */
  portfolios: Portfolio[];
  /** Currently selected portfolio ID */
  activePortfolioId: string | null;
  /** Transaction history across all portfolios */
  transactions: Transaction[];

  /**
   * Gets the currently active portfolio.
   * @returns The active portfolio or undefined if none selected
   */
  getActivePortfolio: () => Portfolio | undefined;

  /**
   * Creates a new portfolio.
   * @param name - Portfolio name (max 50 chars, alphanumeric with spaces/hyphens/underscores)
   * @param currency - Portfolio currency (defaults to "USD")
   * @returns The new portfolio's ID
   * @throws Error if name is empty, too long, or contains invalid characters
   */
  createPortfolio: (name: string, currency?: "USD" | "EUR" | "GBP") => string;

  /**
   * Deletes a portfolio by ID.
   * If the deleted portfolio was active, switches to another portfolio.
   * @param id - Portfolio ID to delete
   */
  deletePortfolio: (id: string) => void;

  /**
   * Sets the active portfolio.
   * @param id - Portfolio ID to activate
   */
  setActivePortfolio: (id: string) => void;

  /**
   * Adds a holding to the active portfolio.
   * @param holding - Holding data (symbol, shares, averageCost)
   * @returns The new holding's ID
   */
  addHolding: (holding: Omit<Holding, "id" | "createdAt" | "updatedAt">) => string;

  /**
   * Updates an existing holding in the active portfolio.
   * @param id - Holding ID to update
   * @param updates - Partial holding data to merge
   */
  updateHolding: (id: string, updates: Partial<Holding>) => void;

  /**
   * Deletes a holding from the active portfolio.
   * Also removes associated transactions.
   * @param id - Holding ID to delete
   */
  deleteHolding: (id: string) => void;

  /**
   * Adds a transaction record.
   * @param transaction - Transaction data (type, holdingId, shares, price, date)
   */
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
}

const MAX_PORTFOLIO_NAME_LENGTH = 50;
const PORTFOLIO_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

export const createPortfolioSlice: StateCreator<PortfolioSlice> = (set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  transactions: [],

  getActivePortfolio: () => {
    const { portfolios, activePortfolioId } = get();
    return portfolios.find((p) => p.id === activePortfolioId);
  },

  createPortfolio: (name, currency = "USD") => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      throw new Error("Portfolio name cannot be empty");
    }
    if (trimmedName.length > MAX_PORTFOLIO_NAME_LENGTH) {
      throw new Error(`Portfolio name cannot exceed ${MAX_PORTFOLIO_NAME_LENGTH} characters`);
    }
    if (!PORTFOLIO_NAME_REGEX.test(trimmedName)) {
      throw new Error("Portfolio name can only contain letters, numbers, spaces, hyphens, and underscores");
    }
    
    const id = crypto.randomUUID();
    const newPortfolio: Portfolio = {
      id,
      name: trimmedName,
      currency,
      createdAt: new Date().toISOString(),
      holdings: [],
    };
    set((state) => ({
      portfolios: [...state.portfolios, newPortfolio],
      activePortfolioId: state.activePortfolioId ?? id,
    }));
    return id;
  },

  deletePortfolio: (id) => {
    set((state) => {
      const filtered = state.portfolios.filter((p) => p.id !== id);
      return {
        portfolios: filtered,
        activePortfolioId:
          state.activePortfolioId === id
            ? filtered[0]?.id ?? null
            : state.activePortfolioId,
      };
    });
  },

  setActivePortfolio: (id) => {
    set({ activePortfolioId: id });
  },

  addHolding: (holdingData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newHolding: Holding = {
      ...holdingData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      portfolios: state.portfolios.map((p) =>
        p.id === state.activePortfolioId
          ? { ...p, holdings: [...p.holdings, newHolding] }
          : p
      ),
    }));
    return id;
  },

  updateHolding: (id, updates) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) =>
        p.id === state.activePortfolioId
          ? {
              ...p,
              holdings: p.holdings.map((h) =>
                h.id === id
                  ? { ...h, ...updates, updatedAt: new Date().toISOString() }
                  : h
              ),
            }
          : p
      ),
    }));
  },

  deleteHolding: (id) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) =>
        p.id === state.activePortfolioId
          ? { ...p, holdings: p.holdings.filter((h) => h.id !== id) }
          : p
      ),
      transactions: state.transactions.filter((t) => t.holdingId !== id),
    }));
  },

  addTransaction: (transactionData) => {
    const id = crypto.randomUUID();
    set((state) => ({
      transactions: [...state.transactions, { ...transactionData, id }],
    }));
  },
});
