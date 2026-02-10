import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";

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
  });

  describe("formatNumber", () => {
    it("formats with default 2 decimal places", () => {
      expect(formatNumber(1234.5678)).toBe("1,234.57");
    });

    it("respects custom decimal places", () => {
      expect(formatNumber(1234.5678, 0)).toBe("1,235");
      expect(formatNumber(1234.5678, 4)).toBe("1,234.5678");
    });
  });
});
