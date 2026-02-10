import { describe, it, expect } from "vitest";
import { cn, createSeededRandom, hashString } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("base", true && "included", false && "excluded")).toBe("base included");
    });

    it("handles arrays", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles undefined and null", () => {
      expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("merges tailwind classes correctly", () => {
      expect(cn("px-4", "px-2")).toBe("px-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles complex tailwind merging", () => {
      expect(cn("p-4 text-sm", "p-2")).toBe("text-sm p-2");
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
    });
  });

  describe("createSeededRandom", () => {
    it("returns a function", () => {
      const random = createSeededRandom(42);
      expect(typeof random).toBe("function");
    });

    it("produces deterministic results for same seed", () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const values1 = [random1(), random1(), random1()];
      const values2 = [random2(), random2(), random2()];

      expect(values1).toEqual(values2);
    });

    it("produces different results for different seeds", () => {
      const random1 = createSeededRandom(100);
      const random2 = createSeededRandom(200);

      expect(random1()).not.toBe(random2());
    });

    it("returns values between 0 and 1", () => {
      const random = createSeededRandom(999);

      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it("produces varied distribution", () => {
      const random = createSeededRandom(42);
      const values = new Set<number>();

      for (let i = 0; i < 100; i++) {
        values.add(Math.floor(random() * 10));
      }

      expect(values.size).toBeGreaterThan(5);
    });
  });

  describe("hashString", () => {
    it("returns a number", () => {
      expect(typeof hashString("test")).toBe("number");
    });

    it("returns same hash for same input", () => {
      expect(hashString("hello")).toBe(hashString("hello"));
    });

    it("returns different hash for different input", () => {
      expect(hashString("hello")).not.toBe(hashString("world"));
    });

    it("returns positive numbers", () => {
      expect(hashString("test")).toBeGreaterThanOrEqual(0);
      expect(hashString("another test")).toBeGreaterThanOrEqual(0);
      expect(hashString("")).toBeGreaterThanOrEqual(0);
    });

    it("handles empty string", () => {
      expect(hashString("")).toBe(0);
    });

    it("handles special characters", () => {
      expect(typeof hashString("@#$%^&*()")).toBe("number");
      expect(hashString("@#$%^&*()")).toBeGreaterThanOrEqual(0);
    });

    it("handles long strings", () => {
      const longString = "a".repeat(10000);
      expect(typeof hashString(longString)).toBe("number");
      expect(hashString(longString)).toBeGreaterThanOrEqual(0);
    });
  });
});
