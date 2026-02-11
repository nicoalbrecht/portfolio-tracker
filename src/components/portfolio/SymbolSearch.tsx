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
  /** Current symbol value */
  value: string;
  /** Called when a symbol is selected or typed */
  onSymbolChange: (symbol: string) => void;
  /** Called when a result is selected (provides full result including name) */
  onResultSelect?: (result: SearchResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** aria-invalid for form validation */
  "aria-invalid"?: boolean;
  /** Search mode: 'symbol' searches by symbol prefix, 'name' searches by name */
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
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  // Track if user is actively typing vs programmatic update
  const isUserTypingRef = useRef(false);

  // Sync external value changes (programmatic updates from other field)
  useEffect(() => {
    if (value !== inputValue) {
      // Don't trigger search when value is set programmatically
      isUserTypingRef.current = false;
      setInputValue(value);
      setIsOpen(false); // Close dropdown on programmatic update
      if (value === "") {
        setSelectedResult(null);
        setResults([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Only search when user is actively typing
  useEffect(() => {
    // Skip search if this wasn't triggered by user typing
    if (!isUserTypingRef.current) {
      return;
    }

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
        if (searchResults.length > 0 && isUserTypingRef.current) {
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

  const handleValueChange = useCallback(
    (newValue: SearchResult | null) => {
      if (newValue) {
        isUserTypingRef.current = false;
        const symbol = newValue.symbol.toUpperCase();
        setInputValue(symbol);
        setSelectedResult(newValue);
        onSymbolChange(symbol);
        onResultSelect?.(newValue);
        setIsOpen(false);
      }
    },
    [onSymbolChange, onResultSelect]
  );

  const handleInputChange = useCallback(
    (newInputValue: string) => {
      isUserTypingRef.current = true;
      const upperValue = newInputValue.toUpperCase();
      setInputValue(upperValue);
      setSelectedResult(null);
      onSymbolChange(upperValue);
      if (upperValue.length > 0) {
        setIsOpen(true);
      }
    },
    [onSymbolChange]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open || inputValue.trim().length > 0) {
      setIsOpen(open);
    }
  }, [inputValue]);

  const showDropdown = isOpen && (isLoading || results.length > 0);

  return (
    <Combobox
      value={selectedResult}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={handleInputChange}
      items={results}
      itemToStringLabel={(item) => (searchMode === "name" ? item.name : item.symbol)}
      itemToStringValue={(item) => (searchMode === "name" ? item.name : item.symbol)}
      open={showDropdown}
      onOpenChange={handleOpenChange}
      inline
    >
      <div className="relative">
        <ComboboxInput
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          showTrigger={false}
          className="uppercase"
        />
        {showDropdown && (
          <div className={cn(
            "absolute top-full left-0 z-50 mt-1 w-full",
            "bg-popover text-popover-foreground",
            "rounded-md border shadow-md",
            "max-h-60 overflow-auto"
          )}>
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
                    <ComboboxItem key={`${result.symbol}-${result.region}-${index}`} value={result}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.type}
                          </span>
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
