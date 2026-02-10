import { StateCreator } from "zustand";
import { Portfolio, Holding, Transaction } from "@/types";

export interface PortfolioSlice {
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  transactions: Transaction[];

  getActivePortfolio: () => Portfolio | undefined;
  createPortfolio: (name: string, currency?: "USD" | "EUR" | "GBP") => string;
  deletePortfolio: (id: string) => void;
  setActivePortfolio: (id: string) => void;

  addHolding: (holding: Omit<Holding, "id" | "createdAt" | "updatedAt">) => string;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export const createPortfolioSlice: StateCreator<PortfolioSlice> = (set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  transactions: [],

  getActivePortfolio: () => {
    const { portfolios, activePortfolioId } = get();
    return portfolios.find((p) => p.id === activePortfolioId);
  },

  createPortfolio: (name, currency = "USD") => {
    const id = crypto.randomUUID();
    const newPortfolio: Portfolio = {
      id,
      name,
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
