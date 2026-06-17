"use client";

import { PropsWithChildren, useEffect, useState, Children, isValidElement, ReactNode } from "react";

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
    <div className="p-6">
      <div className="bg-secondary-200 rounded-3xl min-h-[calc(100vh-48px)] p-8 overflow-y-auto max-h-[calc(100vh-48px)]">
        {/* render sidebar (fixed) */}
        {sidebarNode}

        {/* shifted content */}
        <div style={{ marginLeft, transition: 'margin-left 300ms ease-in-out' }} className={`transition-all duration-300 ${expanded ? 'pl-4' : ''}`}>
          {contentNode}
        </div>
      </div>
    </div>
  );
}
