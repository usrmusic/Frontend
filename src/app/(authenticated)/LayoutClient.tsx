"use client";

import { PropsWithChildren, useEffect, useState, Children, ReactNode } from "react";

const LEFT_OFFSET_PX = 12; // left-12 -> 3rem -> 48px
const COLLAPSED_PX = 80; // approximate collapsed width
const EXPANDED_PX = 240; // approximate expanded width
const GAP_PX = 16;

export default function LayoutClient({ children }: PropsWithChildren) {
  // Always start collapsed to match SSR, then sync from localStorage after mount
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem('sidebar-expanded') === '1');
    } catch {
      // ignore
    }

    function onToggle(e: Event) {
      const ev = e as CustomEvent<{ expanded: boolean }>;
      if (ev?.detail && typeof ev.detail.expanded === 'boolean') setExpanded(ev.detail.expanded);
    }

    window.addEventListener('sidebar:toggle', onToggle as EventListener);
    return () => window.removeEventListener('sidebar:toggle', onToggle as EventListener);
  }, []);

  const sidebarWidth = expanded ? EXPANDED_PX : COLLAPSED_PX;
  const marginLeft = LEFT_OFFSET_PX + sidebarWidth + GAP_PX;

  // children expected: [<Sidebar />, <div id='authenticated-content'>...</div>]
  const arr = Children.toArray(children) as ReactNode[];
  const sidebarNode = arr[0];
  const contentNode = arr.slice(1);

  return (
    // Padding shrinks with the viewport. At the old flat `p-6` + inner `p-8`,
    // 56px per side was being spent on chrome — on a 375px phone that is 30%
    // of the screen gone before any content renders.
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="bg-secondary-200 rounded-2xl lg:rounded-3xl p-3 sm:p-5 lg:p-8 min-h-[calc(100vh-16px)] max-h-[calc(100vh-16px)] sm:min-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-32px)] lg:min-h-[calc(100vh-48px)] lg:max-h-[calc(100vh-48px)] overflow-y-auto overflow-x-hidden">
        {/* render sidebar (fixed on desktop, off-canvas drawer on mobile) */}
        {sidebarNode}

        {/* Content shifts right to clear the sidebar — but only from `xl` up,
            where the sidebar is actually a persistent rail. Below that it is a
            drawer overlaying the page, so any margin here would be dead space.
            The measured width is handed to CSS as a custom property so the
            `xl:` media query owns whether it applies at all; an inline
            `marginLeft` (what this used to be) cannot be made conditional on a
            breakpoint and was pushing every page 348px off a 375px screen.
            `xl` and not `lg` — see the responsive-model note in Sidebar.tsx. */}
        <div
          style={{ ['--sidebar-offset' as string]: `${marginLeft}px` }}
          className={`ml-0 xl:ml-[var(--sidebar-offset)] transition-[margin,padding] duration-300 ${expanded ? 'xl:pl-4' : ''}`}
        >
          {contentNode}
        </div>
      </div>
    </div>
  );
}
