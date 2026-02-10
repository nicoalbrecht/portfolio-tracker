import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioSummary } from "@/components/widgets/PortfolioSummary";
import { Quote } from "@/types";

vi.mock("@/hooks", () => ({
  useActivePortfolio: vi.fn(),
}));

import { useActivePortfolio } from "@/hooks";

const mockUseActivePortfolio = useActivePortfolio as ReturnType<typeof vi.fn>;

function createQuote(overrides: Partial<Quote> & { symbol: string; price: number }): Quote {
  return {
    change: 0,
    changePercent: 0,
    previousClose: overrides.price,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("PortfolioSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no holdings", () => {
    mockUseActivePortfolio.mockReturnValue({
      id: "portfolio-1",
      name: "Test Portfolio",
      holdings: [],
    });

    render(<PortfolioSummary />);

    expect(screen.getByText("No holdings")).toBeInTheDocument();
    expect(screen.getByText("Add your first holding to get started")).toBeInTheDocument();
  });

  it("renders portfolio value header", () => {
    mockUseActivePortfolio.mockReturnValue({
      id: "portfolio-1",
      name: "Test Portfolio",
      holdings: [
        { id: "h1", symbol: "VTI", shares: 100, avgCostBasis: 200 },
      ],
    });

    render(<PortfolioSummary />);

    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
  });

  it("calculates total value correctly", () => {
    mockUseActivePortfolio.mockReturnValue({
      id: "portfolio-1",
      name: "Test Portfolio",
      holdings: [
        { id: "h1", symbol: "VTI", shares: 100, avgCostBasis: 200 },
        { id: "h2", symbol: "SPY", shares: 50, avgCostBasis: 400 },
      ],
    });

    const quotes: Record<string, Quote> = {
      VTI: createQuote({ symbol: "VTI", price: 250, change: 5, changePercent: 2 }),
      SPY: createQuote({ symbol: "SPY", price: 500, change: -2, changePercent: -0.4 }),
    };

    render(<PortfolioSummary quotes={quotes} />);

    expect(screen.getByText("$50,000.00")).toBeInTheDocument();
  });

  it("shows total gain/loss", () => {
    mockUseActivePortfolio.mockReturnValue({
      id: "portfolio-1",
      name: "Test Portfolio",
      holdings: [
        { id: "h1", symbol: "VTI", shares: 100, avgCostBasis: 200 },
      ],
    });

    const quotes: Record<string, Quote> = {
      VTI: createQuote({ symbol: "VTI", price: 250, change: 5, changePercent: 2 }),
    };

    render(<PortfolioSummary quotes={quotes} />);

    expect(screen.getByText("Total Gain/Loss")).toBeInTheDocument();
    expect(screen.getByText("Return")).toBeInTheDocument();
    expect(screen.getByText("Cost Basis")).toBeInTheDocument();
  });

  it("uses avgCostBasis when quotes not available", () => {
    mockUseActivePortfolio.mockReturnValue({
      id: "portfolio-1",
      name: "Test Portfolio",
      holdings: [
        { id: "h1", symbol: "VTI", shares: 100, avgCostBasis: 200 },
      ],
    });

    render(<PortfolioSummary />);

    const valueElements = screen.getAllByText("$20,000.00");
    expect(valueElements.length).toBeGreaterThanOrEqual(1);
  });

  it("returns null when no portfolio", () => {
    mockUseActivePortfolio.mockReturnValue(undefined);

    render(<PortfolioSummary />);

    expect(screen.getByText("No holdings")).toBeInTheDocument();
  });
});
