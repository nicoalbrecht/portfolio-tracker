"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/stores";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
