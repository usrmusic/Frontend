"use client";
import Button from "@/src/components/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";

// The fixed widths are a DESKTOP concern only — they keep the strip's buttons
// evenly sized on a wide screen. On a phone every tab sizes to its own label
// instead (`w-auto`), which is what lets eight of them wrap into three tidy
// rows rather than one 800px-wide line. Written out in full (not interpolated)
// because Tailwind only ships classes it can see literally in the source.
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

  return (
    // Phone: the eight tabs WRAP into compact toggle pills, so every section is
    // visible at once. This replaces a horizontally scrollable strip — that
    // showed roughly two and a half tabs at a time and gave no hint the other
    // five existed, so reaching Company or Email meant swiping blind.
    //
    // `sm` and up: unchanged — the original single-row strip with its fixed
    // widths, still scrollable on the narrow end of that range. The old
    // `-mx-3 px-3` edge bleed went with the scrolling: it existed to stop the
    // first and last tab being clipped mid-glyph at the scroll extremes, and a
    // wrapped list has no extremes to clip.
    <div className="flex flex-wrap gap-1.5 sm:flex-nowrap sm:gap-2 sm:overflow-x-auto no-scrollbar pb-1 sm:snap-x">
      {tabData.map((tab) => {
        // Extract the pathname without query params for matching
        const tabPath = tab.href.split("?")[0];
        // check if the pathname starts with the tab path
        const isActive = pathname.startsWith(tabPath);

        return (
          <Link href={tab.href} key={tab.href} className="shrink-0 sm:snap-start">
            <Button
              type={isActive ? "primary" : undefined}
              // Pills are deliberately smaller than a standard button on a
              // phone — at full button height three wrapped rows would eat
              // most of the space above the fold that the table needs. Scoped
              // with `max-sm:` so the `sm`+ strip keeps AntD's stock sizing
              // and the desktop toolbar is byte-for-byte what it was.
              className={`${tab.className} max-sm:h-8! max-sm:px-3! max-sm:text-xs!`}
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
