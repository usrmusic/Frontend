"use client";
import { Menu } from "lucide-react";

/* Phone-only nav button for a page's own title row. On a phone the global
   header (greeting + its ☰) is hidden on every page that has a title row,
   so ☰ ← Title share one row as in the mobile design; this is that ☰. Same
   look and same `sidebar:mobileToggle` event as the header's button. */
export default function MobileMenuButton() {
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => window.dispatchEvent(new CustomEvent("sidebar:mobileToggle"))}
      className="sm:hidden shrink-0 size-11 flex items-center justify-center rounded-full bg-white text-foreground hover:bg-black hover:text-white transition-colors"
    >
      <Menu size={20} />
    </button>
  );
}
