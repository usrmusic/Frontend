"use client";
import Button from "@/src/components/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// The fixed widths are a DESKTOP concern only — they keep the strip's buttons
// evenly sized on a wide screen. On a phone every tab sizes to its own label
// instead (`w-auto`). Written out in full (not interpolated) because Tailwind
// only ships classes it can see literally in the source.
const tabData = [
  { label: "Users", href: "/users?title=Users", className: "w-auto sm:w-23.5" },
  { label: "Clients", href: "/clients?title=Clients", className: "w-auto sm:w-23.5" },
  { label: "Venues", href: "/venues?title=Venues", className: "w-auto sm:w-23.5" },
  {
    label: "Suppliers",
    href: "/suppliers?title=Suppliers",
    className: "w-auto sm:w-23.5",
  },
  { label: "Packages", href: "/packages?title=Packages", className: "w-auto sm:w-23.5" },
  { label: "Company", href: "/company?title=Company", className: "w-auto sm:w-23.5" },
  {
    label: "Manage Access",
    href: "/manage-access?title=Manage%20Access",
    className: "w-auto sm:w-33.75",
  },
  { label: "Email", href: "/email?title=Email", className: "w-auto sm:w-23.5" },
];

const Tabs = () => {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // One swipeable row on every screen size (per the mobile design). The
  // active tab is scrolled into view so a later tab like Company or Email is
  // never left selected but off-screen.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    // `-mx-3 px-3` lets the strip bleed to the screen edge on a phone so the
    // first/last pill isn't clipped mid-glyph at the scroll extremes; the
    // `py-1` leaves room for the buttons' drop shadow inside the scroller.
    <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x -mx-3 px-3 py-1 sm:mx-0 sm:px-0">
      {tabData.map((tab) => {
        // Extract the pathname without query params for matching
        const tabPath = tab.href.split("?")[0];
        // check if the pathname starts with the tab path
        const isActive = pathname.startsWith(tabPath);

        return (
          <Link
            href={tab.href}
            key={tab.href}
            ref={isActive ? activeRef : undefined}
            className="shrink-0 snap-start"
          >
            <Button
              type={isActive ? "primary" : undefined}
              className={`${tab.className} max-sm:px-4!`}
            >
              {tab.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
};

export default Tabs;
