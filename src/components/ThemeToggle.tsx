"use client";

import { Sun } from "lucide-react";

/**
 * The Chalk & Slate direction is intentionally a single dark theme, so the
 * control stays visible for layout parity but is marked as unavailable.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Theme switching is coming soon"
      data-testid="button-theme-toggle"
      className="inline-flex h-10 w-10 cursor-default items-center justify-center rounded-full border border-chalk/25 text-chalk/75 transition-colors hover:border-chalk/40 hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-slate"
    >
      <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="sr-only">Theme switching is coming soon</span>
    </button>
  );
}
