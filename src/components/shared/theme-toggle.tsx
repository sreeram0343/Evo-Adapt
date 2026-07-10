'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-1.5 rounded border border-border-custom hover:bg-secondary-surface text-muted-text hover:text-foreground transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-primary-action/40"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-3.5 h-3.5" />
      ) : (
        <Sun className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
