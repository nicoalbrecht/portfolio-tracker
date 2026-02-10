import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent, formatNumber, formatDate, formatShares } from "@/lib/formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("formats positive values correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats zero correctly", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats negative values correctly", () => {
      expect(formatCurrency(-500.5)).toBe("-$500.50");
    });

    it("supports EUR currency", () => {
      expect(formatCurrency(1234.56, "EUR")).toContain("1,234.56");
    });

    it("supports GBP currency", () => {
      expect(formatCurrency(1234.56, "GBP")).toContain("1,234.56");
    });
  });

  describe("formatPercent", () => {
    it("formats positive percentages with plus sign", () => {
      expect(formatPercent(5.25)).toBe("+5.25%");
    });

    it("formats negative percentages", () => {
      expect(formatPercent(-3.5)).toBe("-3.50%");
    });

    it("formats zero with plus sign", () => {
      expect(formatPercent(0)).toBe("+0.00%");
    });

    it("respects custom decimal places", () => {
      expect(formatPercent(5.123, 1)).toBe("+5.1%");
      expect(formatPercent(5.123, 3)).toBe("+5.123%");
    });
  });

  describe("formatNumber", () => {
    it("formats with default 2 decimal places", () => {
      expect(formatNumber(1234.5678)).toBe("1,234.57");
    });

    it("respects custom decimal places", () => {
      expect(formatNumber(1234.5678, 0)).toBe("1,235");
      expect(formatNumber(1234.5678, 4)).toBe("1,234.5678");
    });

    it("adds thousand separators", () => {
      expect(formatNumber(1000000)).toBe("1,000,000.00");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string to readable format", () => {
      expect(formatDate("2025-02-10")).toBe("Feb 10, 2025");
    });

    it("formats full ISO datetime string", () => {
      expect(formatDate("2024-12-25T10:30:00Z")).toBe("Dec 25, 2024");
    });

    it("handles various date formats", () => {
      expect(formatDate("2024-01-01")).toBe("Jan 1, 2024");
      expect(formatDate("2024-06-15")).toBe("Jun 15, 2024");
    });
  });

  describe("formatShares", () => {
    it("formats whole number shares without decimals", () => {
      expect(formatShares(100)).toBe("100");
      expect(formatShares(1000)).toBe("1,000");
    });

    it("formats fractional shares with decimals", () => {
      expect(formatShares(100.5)).toBe("100.50");
      expect(formatShares(25.1234)).toBe("25.1234");
    });

    it("adds thousand separators", () => {
      expect(formatShares(10000)).toBe("10,000");
      expect(formatShares(10000.5)).toBe("10,000.50");
    });
  });
});
