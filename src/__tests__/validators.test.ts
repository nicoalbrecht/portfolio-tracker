import { describe, it, expect } from "vitest";
import { holdingSchema, HoldingFormData } from "@/lib/validators";

describe("holdingSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid holding data", () => {
      const validData = {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("VTI");
      }
    });

    it("accepts lowercase symbol and transforms to uppercase", () => {
      const data = {
        symbol: "vti",
        name: "Test ETF",
        shares: 10,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("VTI");
      }
    });

    it("accepts optional notes field", () => {
      const dataWithNotes = {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF",
        shares: 50,
        avgCostBasis: 450,
        purchaseDate: "2024-02-01",
        notes: "Long term hold",
      };

      const result = holdingSchema.safeParse(dataWithNotes);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Long term hold");
      }
    });

    it("accepts data without notes field", () => {
      const dataWithoutNotes = {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        shares: 25,
        avgCostBasis: 380,
        purchaseDate: "2024-03-01",
      };

      const result = holdingSchema.safeParse(dataWithoutNotes);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty symbol", () => {
      const data = {
        symbol: "",
        name: "Test ETF",
        shares: 10,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects symbol longer than 10 characters", () => {
      const data = {
        symbol: "VERYLONGSYMBOL",
        name: "Test ETF",
        shares: 10,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects negative shares", () => {
      const data = {
        symbol: "VTI",
        name: "Test ETF",
        shares: -10,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects zero shares", () => {
      const data = {
        symbol: "VTI",
        name: "Test ETF",
        shares: 0,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects negative cost basis", () => {
      const data = {
        symbol: "VTI",
        name: "Test ETF",
        shares: 10,
        avgCostBasis: -100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const data = {
        symbol: "VTI",
        name: "",
        shares: 10,
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty purchase date", () => {
      const data = {
        symbol: "VTI",
        name: "Test ETF",
        shares: 10,
        avgCostBasis: 100,
        purchaseDate: "",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects non-numeric shares", () => {
      const data = {
        symbol: "VTI",
        name: "Test ETF",
        shares: "ten",
        avgCostBasis: 100,
        purchaseDate: "2024-01-15",
      };

      const result = holdingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("infers correct type from schema", () => {
      const validData: HoldingFormData = {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        shares: 100,
        avgCostBasis: 200.5,
        purchaseDate: "2024-01-15",
        notes: undefined,
      };

      const result = holdingSchema.parse(validData);
      expect(result.symbol).toBe("VTI");
      expect(typeof result.shares).toBe("number");
      expect(typeof result.avgCostBasis).toBe("number");
    });
  });
});
