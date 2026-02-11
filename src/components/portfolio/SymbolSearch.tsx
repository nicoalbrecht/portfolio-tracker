"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { searchSymbols, SearchResult } from "@/lib/api";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SymbolSearchProps {
  value: string;
  onSymbolChange: (value: string) => void;
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  searchMode?: "symbol" | "name";
}

export function SymbolSearch({
  value,
  onSymbolChange,
  onResultSelect,
  placeholder = "Search symbol...",
  disabled = false,
  "aria-invalid": ariaInvalid,
  searchMode = "symbol",
}: SymbolSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setInputValue(value);
      setIsOpen(false);
      if (value === "") {
        setResults([]);
      }
    }
    prevValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchSymbols(query);
        setResults(searchResults);
        if (searchResults.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Symbol search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleInputChange = useCallback(
    (newValue: string, eventDetails?: { reason?: string }) => {
      const reason = eventDetails?.reason;
      if (reason === "item-press" || reason === "input-clear") {
        return;
      }
      const processed = searchMode === "symbol" ? newValue.toUpperCase() : newValue;
      setInputValue(processed);
      onSymbolChange(processed);
    },
    [onSymbolChange, searchMode]
  );

  const handleSelect = useCallback(
    (result: SearchResult | null) => {
      if (!result) return;
      const displayValue = searchMode === "name" ? result.name : result.symbol;
      setInputValue(displayValue);
      prevValueRef.current = displayValue;
      setIsOpen(false);
      setResults([]);
      onResultSelect?.(result);
    },
    [onResultSelect, searchMode]
  );

  const showDropdown = isOpen && (isLoading || results.length > 0);

  return (
    <Combobox
      value={null}
      onValueChange={handleSelect}
      inputValue={inputValue}
      onInputValueChange={handleInputChange}
      items={results}
      itemToStringLabel={(item: SearchResult | null) => item ? (searchMode === "name" ? item.name : item.symbol) : ""}
      itemToStringValue={(item: SearchResult | null) => item ? (searchMode === "name" ? item.name : item.symbol) : ""}
      open={showDropdown}
      onOpenChange={setIsOpen}
      inline
    >
      <div className="relative">
        <ComboboxInput
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          showTrigger={false}
          className={searchMode === "symbol" ? "uppercase" : undefined}
        />
        {showDropdown && (
          <div
            className={cn(
              "absolute top-full left-0 z-50 mt-1 w-full",
              "bg-popover text-popover-foreground",
              "rounded-md border shadow-md",
              "max-h-60 overflow-auto"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : (
              <>
                <ComboboxEmpty className="py-4 text-center text-sm text-muted-foreground">
                  No results found.
                </ComboboxEmpty>
                <ComboboxList className="p-1">
                  {(result, index) => (
                    <ComboboxItem
                      key={`${result.symbol}-${result.region}-${index}`}
                      value={result}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-xs text-muted-foreground">{result.type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {result.name}
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </>
            )}
          </div>
        )}
      </div>
    </Combobox>
  );
}
