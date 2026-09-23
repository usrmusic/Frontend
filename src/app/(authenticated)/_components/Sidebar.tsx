"use client";

import {
  Calendar,
  Contacts,
  Dashboard,
  Enquiry,
  Logout,
  MailOpen,
  Reports,
} from "@/src/components/Icons";
import {
  TbReportSearch,
  TbReportAnalytics,
  TbFileDownload,
  TbFileUpload,
  TbTruckDelivery,
} from "react-icons/tb";
import { RiFileListLine } from "react-icons/ri";
import { MoreHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { useState, useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "@/src/components/common/Avatar";
import { useAuth } from "@/src/hooks/useAuth";
import useRole from "@/src/hooks/useRole";

// Sidebar visibility maps to the same permissions used by checkPermission()
// on the Express backend, which mirror the @hasrole/can: gates from the
// Laravel reference app. Items the user lacks permission for are not rendered.
type LinkItem = {
  href: string;
  icon: ReactNode;
  label: string;
  permission?: string;
  permissionAny?: string[];
};

// ── Responsive model ────────────────────────────────────────────────────────
// Below `xl` (1280px) the sidebar is an off-canvas drawer: it sits at the left
// screen edge, full height, always label-expanded, and is translated out of
// view until the header's hamburger opens it. At `xl` and up it is the
// original floating rail that collapses to icons.
//
// The pivot is `xl`, not `lg`. At `lg` (1024px) an iPad Pro portrait (1032px
// viewport) qualified as "desktop" and got the persistent rail — which costs
// 48px offset + 240px rail + 16px gap = 304px, ~29% of the screen, and left
// the header only 74px for the greeting once its search/year/action tools had
// taken their fixed widths. 1280px is the first width where the rail and a
// side-by-side header genuinely coexist. Header.tsx pivots on the same
// breakpoint and the two must stay in sync.
//
// The split is expressed entirely in Tailwind `xl:` classes rather than a JS
// breakpoint check, because a JS check can only produce a correct answer after
// mount — which means a phone would paint one frame of the 240px desktop rail
// before snapping to the drawer. CSS media queries resolve before first paint,
// so there is no flash. `expanded` therefore only ever means "expanded on
// desktop"; on mobile the drawer is unconditionally expanded.
const Sidebar = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: authUser, isLoading } = useAuth();
  const { isClient } = useRole();

  const [tooltip, setTooltip] = useState<{
    label: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    label: "",
    x: 0,
    y: 0,
    visible: false,
  });

  // Always start collapsed to match SSR, then sync from localStorage after mount
  const [expanded, setExpanded] = useState<boolean>(false);

  // Mobile drawer open/closed. Never persisted — a drawer should always start
  // shut on a fresh page load.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem("sidebar-expanded") === "1");
    } catch {
      // ignore
    }
  }, []);

  // The hamburger lives in Header, which is a sibling in the layout tree, so
  // there is no shared parent to hold this state without lifting it into a
  // provider. The app already uses window CustomEvents for exactly this kind
  // of cross-component signal (see `sidebar:toggle`, `dashboard:yearChange`),
  // so this follows that convention rather than introducing a second pattern.
  useEffect(() => {
    function onMobileToggle() {
      setMobileOpen((s) => !s);
    }
    window.addEventListener("sidebar:mobileToggle", onMobileToggle);
    return () =>
      window.removeEventListener("sidebar:mobileToggle", onMobileToggle);
  }, []);

  // Navigating away must close the drawer, or the new page renders underneath
  // an open overlay.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock the page behind the drawer so a scroll gesture over the backdrop
  // moves the drawer's own list rather than the content underneath it.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const handleToggle = (next: boolean) => {
    try {
      localStorage.setItem("sidebar-expanded", next ? "1" : "0");
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(
        new CustomEvent("sidebar:toggle", { detail: { expanded: next } }),
      );
    } catch {
      // ignore
    }
  };

  const showTooltip = (event: MouseEvent<HTMLElement>, label: string) => {
    if (expanded) return;
    // Tooltips exist to name an icon that has no visible label. In the mobile
    // drawer every item is labelled, and a touch "hover" would leave one
    // stranded on screen with no pointer-leave to dismiss it.
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1280px)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      x: rect.right + 12,
      y: rect.top + rect.height / 2,
      visible: true,
    });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Permission checking functions.
  // `manage_all` / `super_admin` short-circuit everything, mirroring Laravel's
  // Gate::before (AuthServiceProvider), which returns true for Super Admin on
  // every ability. The backend's checkPermission already honours this bypass,
  // so without it here the sidebar could hide a page the API would happily
  // serve — e.g. a Super Admin whose role lost an individual permission via
  // Manage Access would stop seeing the nav item while still having access.
  const hasBypass = (): boolean =>
    !!authUser?.permissions?.some((p) =>
      ["manage_all", "manage all", "super_admin", "super admin"].includes(p),
    );

  const can = (permission: string): boolean => {
    if (!authUser?.permissions) return false;
    if (hasBypass()) return true;
    return authUser.permissions.includes(permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (!authUser?.permissions) return false;
    if (hasBypass()) return true;
    return permissions.some((p) => authUser.permissions?.includes(p));
  };

  // Priority links — always shown flat, never grouped.
  const standaloneLinks: LinkItem[] = [
    { href: "/dashboard", icon: <Dashboard />, label: "Dashboard" },
    { href: "/enquiry", icon: <Enquiry />, label: "Enquiry", permission: "new enquiry" },
    { href: "/open-enquiry", icon: <MailOpen />, label: "Open Enquiry", permission: "open enquiry" },
    { href: "/confirmed-events", icon: <Reports />, label: "Confirmed Events", permission: "confirm event" },
    { href: "/rig-list", icon: <RiFileListLine size={20} />, label: "Rig List", permission: "rig list" },
    { href: "/calendar", icon: <Calendar />, label: "Calendar", permission: "calendar" },
  ];

  // Secondary links — tucked under a "More" toggle for Admin/Staff (who
  // typically have every permission and would otherwise see a long list);
  // a Client only ever has 1-2 of these anyway, so they're shown flat
  // instead of hiding behind an extra click.
  const moreLinks: LinkItem[] = [
    { href: "/completed-events", icon: <TbReportSearch size={20} />, label: "Completed Events", permission: "complete event" },
    { href: "/file-upload", icon: <TbFileUpload size={20} />, label: "File Upload", permission: "file upload" },
    { href: "/downloads", icon: <TbFileDownload size={20} />, label: "Downloads", permissionAny: ["downloads", "media manager"] },
    { href: "/suppliers-report", icon: <TbTruckDelivery size={20} />, label: "Suppliers Report", permission: "supplier reporting" },
    { href: "/admin-report", icon: <TbReportAnalytics size={20} />, label: "Admin Report", permission: "admin reporting" },
    { href: "/users?title=Users", icon: <Contacts />, label: "Users", permissionAny: ["user", "manage access"] },
  ];

  const isAllowed = (item: LinkItem) => {
    if (item.permissionAny) return canAny(item.permissionAny);
    if (item.permission) return can(item.permission);
    return true;
  };

  // While `/auth/me` is loading we render nothing in the gated slots — this
  // matches the Laravel server-rendered behavior where the menu is computed
  // before any markup is sent to the browser.
  const visiblePriority = isLoading ? [] : standaloneLinks.filter(isAllowed);
  const visibleMore = isLoading ? [] : moreLinks.filter(isAllowed);
  // Client: everything flat, no "More" toggle. Admin/Staff: secondary links
  // tucked behind "More".
  const visibleStandalone = isClient ? [...visiblePriority, ...visibleMore] : visiblePriority;
  const groupedMore = isClient ? [] : visibleMore;

  const [moreOpen, setMoreOpen] = useState(false);

  // ── Shared class fragments ────────────────────────────────────────────────
  // Mobile-first: the un-prefixed classes describe the drawer (full-width rows
  // with visible labels); the `xl:` variants restore the desktop rail, which
  // still honours `expanded`.
  const railRow = expanded
    ? "justify-start w-full gap-3 px-3 py-2 rounded-md"
    : "justify-start w-full gap-3 px-3 py-2 rounded-md xl:justify-center xl:w-10 xl:h-10 xl:gap-0 xl:px-0 xl:py-0 xl:rounded-full";

  const railLabel = expanded
    ? "max-w-[200px] opacity-100 ml-2"
    : "max-w-[200px] opacity-100 ml-2 xl:max-w-0 xl:opacity-0 xl:ml-0";

  // Touch targets: 44px minimum is the accessibility floor for a finger, and
  // the desktop rows are 36-40px. `min-h-11` on mobile only, so the desktop
  // rail's tighter rhythm is untouched.
  const touch = "min-h-11 xl:min-h-0";

  return (
    <>
      {/* Backdrop — mobile only. `xl:hidden` rather than unmounting it so the
          fade can play out on the way back to desktop width. */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 xl:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        // `transition-[translate,width]`, NOT `transition-[transform,width]`.
        // Tailwind v4 compiles `translate-x-*` to the standalone `translate`
        // CSS property (`translate: -100% 0`), not to `transform:
        // translateX()` the way v3 did. A transition-property list naming
        // `transform` therefore never matches what actually changes, and the
        // drawer jumps into place with no animation. Tailwind's own
        // `transition-transform` utility covers this by listing all four
        // (`transform, translate, scale, rotate`) — worth copying if this ever
        // grows beyond a slide.
        className={`fixed no-scrollbar overflow-x-hidden z-50 bg-secondary-50 flex flex-col gap-6 py-5 transition-[translate,width] duration-300 ease-in-out
          inset-y-0 left-0 w-[min(84vw,272px)] items-start px-4 rounded-r-3xl shadow-2xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0 xl:inset-y-auto xl:top-12.5 xl:bottom-12.5 xl:left-12 xl:rounded-[50px] xl:shadow-none
          ${expanded ? "xl:w-60 xl:items-start xl:px-4" : "xl:w-20 xl:items-center xl:px-0"}`}
        aria-expanded={expanded}
        aria-hidden={undefined}
      >
        {/* Drawer close affordance — mobile only. Without it the only way out
            is the backdrop, which is not discoverable enough to be the sole
            exit. */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors xl:hidden"
        >
          <X size={18} />
        </button>

        <div
          className={`flex flex-col gap-2 w-full h-full overflow-hidden mt-10 xl:mt-0 ${expanded ? "xl:gap-4" : "xl:gap-3"}`}
        >
          <div
            className={`flex flex-col gap-2 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar ${expanded ? "xl:gap-4" : "xl:gap-3 xl:items-center"}`}
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
          {visibleStandalone.map((item, index) => {
            const isActive = pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                id={`sidebar-link-standalone-${index}`}
                key={`standalone-${index}`}
                href={item.href}
                onMouseEnter={(e) => showTooltip(e, item.label)}
                onMouseMove={(e) => showTooltip(e, item.label)}
                onMouseLeave={hideTooltip}
                className={`group relative flex shrink-0 items-center ${railRow} ${touch} hover:bg-black hover:text-white transition-colors duration-200 ${isActive ? "bg-black text-white" : ""}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${railLabel}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {groupedMore.length > 0 && (
            // Every other nav item is a DIRECT child of the rail's flex
            // container, so its `xl:items-center` centers them on the collapsed
            // desktop rail. This one isn't — it needs a wrapper to hold the
            // "More" submenu underneath it — and a `w-full` wrapper spans the
            // whole rail, leaving the 40px button sitting at its left edge
            // while every icon above it is centred. Re-applying the centring
            // on the wrapper itself lines it back up. Collapsed-desktop only:
            // when expanded, rows are full-width and left-aligned by design.
            <div className={`w-full ${expanded ? "" : "xl:flex xl:flex-col xl:items-center"}`}>
              <button
                type="button"
                onClick={() => {
                  // On the collapsed desktop rail there is nowhere to draw a
                  // submenu, so "More" first expands the rail. The mobile
                  // drawer is already expanded, so it just toggles — hence the
                  // matchMedia guard rather than keying off `expanded` alone.
                  const isDesktop =
                    typeof window === "undefined" ||
                    window.matchMedia("(min-width: 1280px)").matches;
                  if (isDesktop && !expanded) {
                    setExpanded(true);
                    handleToggle(true);
                    setMoreOpen(true);
                    return;
                  }
                  setMoreOpen((s) => !s);
                }}
                onMouseEnter={(e) => showTooltip(e, "More")}
                onMouseMove={(e) => showTooltip(e, "More")}
                onMouseLeave={hideTooltip}
                className={`group relative flex items-center ${railRow} ${touch} hover:bg-black hover:text-white transition-colors duration-200 ${groupedMore.some((c) => pathname.startsWith(c.href.split("?")[0])) ? "bg-black text-white" : ""}`}
              >
                <span className="shrink-0"><MoreHorizontal size={20} /></span>
                <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${railLabel}`}>More</span>
              </button>

              {/* Open state: always available on mobile (the drawer is always
                  expanded), gated on `expanded` for the desktop rail. */}
              <div className={`${moreOpen ? "pl-8 mt-2 flex flex-col gap-1" : "hidden"} ${expanded ? "" : "xl:hidden"}`}>
                {groupedMore.map((c, idx) => {
                  const isActive = pathname.startsWith(c.href.split("?")[0]);
                  return (
                    <Link
                      key={`more-${idx}`}
                      href={c.href}
                      onMouseEnter={(e) => showTooltip(e, c.label)}
                      onMouseMove={(e) => showTooltip(e, c.label)}
                      onMouseLeave={hideTooltip}
                      className={`group relative flex w-full items-center justify-start gap-3 px-3 py-2 rounded-md text-sm ${touch} hover:bg-black hover:text-white transition-colors duration-200 ${isActive ? "bg-black text-white" : "text-gray-600"}`}
                    >
                      <span className="shrink-0">{c.icon}</span>
                      <span className="overflow-hidden whitespace-nowrap">{c.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          </div>

          <div
            className={`flex flex-col gap-2 w-full shrink-0 pt-3 mt-1 border-t border-gray-200 ${expanded ? "xl:gap-4" : "xl:gap-3 xl:items-center"}`}
          >
          <div className="w-full xl:w-auto">
            <Link
              href="/login"
              onClick={() => {
                deleteCookie("token");
                deleteCookie("refreshToken");
                // Drop cached permissions/user so the next login starts clean.
                queryClient.clear();
              }}
              onMouseEnter={(e) => showTooltip(e, "Logout")}
              onMouseMove={(e) => showTooltip(e, "Logout")}
              onMouseLeave={hideTooltip}
              className={`group relative flex shrink-0 items-center ${railRow} ${touch} hover:bg-black hover:text-white transition-colors duration-200`}
            >
              <span className="shrink-0"><Logout /></span>
              <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${railLabel}`}>Logout</span>
            </Link>
          </div>

          <div className="w-full xl:w-auto">
            <Link
              href="/profile"
              onMouseEnter={(e) => showTooltip(e, "Profile")}
              onMouseMove={(e) => showTooltip(e, "Profile")}
              onMouseLeave={hideTooltip}
              className={`group relative flex shrink-0 items-center ${railRow} ${touch} hover:bg-black hover:text-white transition-colors duration-200`}
            >
              <Avatar
                src={getImageSrc(authUser?.profile_photo || undefined)}
                initials={
                  authUser?.name
                    ? authUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "U"
                }
                size={40}
                className="size-10 shrink-0"
              />
              <span
                className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${railLabel}`}
              >
                {authUser?.name ?? "User"}
              </span>
            </Link>
          </div>

          {/* Collapse toggle is meaningless in the drawer (which has no
              collapsed state), so it is desktop-only. */}
          <div
            className={`hidden xl:flex w-full ${expanded ? "justify-end pr-1" : "justify-center"}`}
          >
            <button
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => {
                setExpanded((s) => {
                  const n = !s;
                  handleToggle(n);
                  return n;
                });
              }}
              className={`border size-10 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-colors duration-200 ${expanded ? "bg-black text-white" : ""}`}
            >
              <span aria-hidden>{expanded ? "‹" : "›"}</span>
            </button>
          </div>
          </div>
        </div>
      </div>
      {!expanded &&
        tooltip.visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-9999 -translate-y-1/2 rounded-md bg-black px-2 py-1 text-sm whitespace-nowrap text-white shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </>
  );
};

function getImageSrc(p?: string) {
  if (!p) return undefined;
  if (/^(data:|https?:\/\/|\/\/)/i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return `/${p}`;
}

export default Sidebar;
