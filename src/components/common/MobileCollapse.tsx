"use client";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const isPhone = () => window.matchMedia("(max-width: 639px)").matches;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Must match `.mobile-collapse-out` in globals.css. */
const CLOSE_MS = 180;

/* Phone-only collapsible section (dashboard cards, Confirmed Events' Event
   Details box): tapping the title row folds the body away. Desktop and tablet
   always show the body — every class here is phone-scoped and the row only
   toggles on a phone. Starts from `defaultOpen` on every visit (nothing is
   remembered).

   Animated: the body fades/slides in on open and out on close — it stays
   rendered for CLOSE_MS while it fades, then hides. The animation classes
   are only applied to a real box: a `display: contents` wrapper has none to
   animate, so wrappers using `bodyClass` are `max-sm:block`. */
export function useMobileCollapse(defaultOpen = true) {
  const [state, setState] = useState<"open" | "closing" | "closed">(
    defaultOpen ? "open" : "closed",
  );
  // Only animate in after a tap — not the default-open state on page load.
  const [animateIn, setAnimateIn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const expand = () => {
    if (timer.current) clearTimeout(timer.current);
    setAnimateIn(true);
    setState("open");
  };
  const collapse = () => {
    if (reducedMotion()) {
      setState("closed");
      return;
    }
    setState("closing");
    timer.current = setTimeout(() => setState("closed"), CLOSE_MS);
  };
  const toggle = () => (state === "open" ? collapse() : expand());

  return {
    /** Expanded (or expanding) — drives the chevron and aria-expanded. */
    open: state === "open",
    /** Body still on screen (open, or fading out) — for spacing around it. */
    visible: state !== "closed",
    toggle,
    expand,
    /** For the whole title row — a big tap target, phone only. */
    onHeaderClick: () => {
      if (isPhone()) toggle();
    },
    /** Hides/animates the body on a phone. */
    bodyClass:
      state === "closed"
        ? "max-sm:hidden"
        : state === "closing"
          ? "mobile-collapse-out"
          : animateIn
            ? "mobile-collapse-in"
            : "",
  };
}

export function CollapseChevron({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Collapse" : "Expand"}
      aria-expanded={open}
      onClick={(e) => {
        // The title row toggles too — don't let this click do it twice.
        e.stopPropagation();
        onToggle();
      }}
      className="sm:hidden shrink-0 size-8 -mr-1 flex items-center justify-center text-gray-500"
    >
      <ChevronDown size={18} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}
