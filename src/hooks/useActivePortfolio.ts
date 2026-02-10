import { useStore } from "@/stores";

/**
 * Returns the currently active portfolio from the store.
 * Convenience hook that selects the active portfolio with proper memoization.
 * @returns The active portfolio or undefined if none selected
 */
export function useActivePortfolio() {
  return useStore((state) => state.getActivePortfolio());
}
