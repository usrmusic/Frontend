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
  TbReportMedical,
  TbReportAnalytics,
  TbFileDownload,
  TbFileUpload,
} from "react-icons/tb";
import { RiFileListLine } from "react-icons/ri";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { useState, useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "@/src/components/common/Avatar";
import { useAuth } from "@/src/hooks/useAuth";

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

type Group = {
  key: string;
  label: string;
  icon: ReactNode;
  children: LinkItem[];
};

const Sidebar = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: authUser, isLoading } = useAuth();

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

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem("sidebar-expanded") === "1");
    } catch {
      // ignore
    }
  }, []);

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

  // Permission checking functions
  const can = (permission: string): boolean => {
    if (!authUser?.permissions) return false;
    return authUser.permissions.includes(permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (!authUser?.permissions) return false;
    return permissions.some((p) => authUser.permissions?.includes(p));
  };

  // Top-level priority links — always visible, never inside a folder.
  // Dashboard is visible to all authenticated users; the rest are permission-gated.
  const standaloneLinks: LinkItem[] = [
    { href: "/dashboard", icon: <Dashboard />, label: "Dashboard" },
    { href: "/enquiry", icon: <Enquiry />, label: "Enquiry", permission: "new enquiry" },
    { href: "/open-enquiry", icon: <MailOpen />, label: "Open Enquiry", permission: "open enquiry" },
    { href: "/confirmed-events", icon: <Reports />, label: "Confirmed Events", permission: "confirm event" },
    { href: "/rig-list", icon: <RiFileListLine size={20} />, label: "Rig List", permission: "rig list" },
    { href: "/calendar", icon: <Calendar />, label: "Calendar", permission: "calendar" },
  ];

  const groups: Group[] = [
    {
      key: "more",
      label: "More",
      icon: <MoreHorizontal size={20} />,
      children: [
        { href: "/completed-events", icon: <TbReportSearch size={20} />, label: "Completed Events", permission: "complete event" },
        { href: "/file-upload", icon: <TbFileUpload size={20} />, label: "File Upload", permission: "file upload" },
        { href: "/downloads", icon: <TbFileDownload size={20} />, label: "Downloads", permission: "downloads" },
        // { href: "/suppliers-report", icon: <TbReportMedical size={20} />, label: "Suppliers Report", permission: "supplier reporting" },
        { href: "/admin-report", icon: <TbReportAnalytics size={20} />, label: "Admin Report", permission: "admin reporting" },
        { href: "/users?title=Users", icon: <Contacts />, label: "Users", permissionAny: ["user", "manage access"] },
      ],
    },
  ];

  const isAllowed = (item: LinkItem) => {
    if (item.permissionAny) return canAny(item.permissionAny);
    if (item.permission) return can(item.permission);
    return true;
  };

  // While `/auth/me` is loading we render nothing in the gated slots — this
  // matches the Laravel server-rendered behavior where the menu is computed
  // before any markup is sent to the browser.
  const visibleStandalone = isLoading ? [] : standaloneLinks.filter(isAllowed);
  const visibleGroups = isLoading
    ? []
    : groups
        .map((g) => ({ ...g, children: g.children.filter(isAllowed) }))
        .filter((g) => g.children.length > 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    more: false,
  }));

  return (
    <>
      <div
        className={`fixed no-scrollbar overflow-x-hidden top-12.5 bottom-12.5 left-12 bg-secondary-50 flex flex-col gap-6 py-5 rounded-[50px] transition-all duration-300 ease-in-out ${expanded ? "w-60 items-start px-4" : "w-20  items-center"} z-50`}
        aria-expanded={expanded}
      >
        <div
          className={`flex flex-col ${expanded ? "gap-4 w-full" : "gap-3"} h-full overflow-hidden`}
        >
          <div
            className={`flex flex-col ${expanded ? "gap-4 w-full" : "gap-3 items-center"} flex-1 overflow-y-auto overflow-x-hidden no-scrollbar`}
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
                className={`group relative flex shrink-0 items-center ${expanded ? "justify-start w-full gap-3 px-3 py-2 rounded-md" : "justify-center size-10 rounded-full"} hover:bg-black hover:text-white transition-colors duration-200 ${isActive ? "bg-black text-white" : ""}`}
              >
                {item.icon}
                <span
                  className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {visibleGroups.map((g) => {
            const anyActive = g.children.some((c) => pathname.startsWith(c.href.split("?")[0]));
            const open = !!openGroups[g.key];
            return (
              <div key={g.key} className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (!expanded) {
                      setExpanded(true);
                      handleToggle(true);
                      setOpenGroups((s) => ({ ...s, [g.key]: true }));
                      return;
                    }
                    setOpenGroups((s) => ({ ...s, [g.key]: !s[g.key] }));
                  }}
                  onMouseEnter={(e) => showTooltip(e, g.label)}
                  onMouseMove={(e) => showTooltip(e, g.label)}
                  onMouseLeave={hideTooltip}
                  className={`group relative flex w-full items-center ${expanded ? "justify-start gap-3 px-3 py-2 rounded-md" : "justify-center size-10 rounded-full"} hover:bg-black hover:text-white transition-colors duration-200 ${anyActive ? "bg-black text-white" : ""}`}
                >
                  {g.icon}
                  <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"}`}>{g.label}</span>
                </button>

                <div className={`${open && expanded ? "pl-8 mt-2" : "hidden"}`}>
                  {g.children.map((c, idx) => {
                    const isActive = pathname.startsWith(c.href.split("?")[0]);
                    return (
                      <Link
                        key={`${g.key}-child-${idx}`}
                        href={c.href}
                        onMouseEnter={(e) => showTooltip(e, c.label)}
                        onMouseMove={(e) => showTooltip(e, c.label)}
                        onMouseLeave={hideTooltip}
                        className={`group relative flex w-full items-center justify-start gap-3 px-3 py-2 rounded-md text-[13px] hover:bg-black hover:text-white transition-colors duration-200 ${isActive ? "bg-black text-white" : "text-gray-600"}`}
                      >
                        {c.icon}
                        <span className="overflow-hidden whitespace-nowrap">{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          </div>

          <div
            className={`flex flex-col ${expanded ? "gap-4 w-full" : "gap-3 items-center"} shrink-0 pt-3 mt-1 border-t border-gray-200`}
          >
          <div>
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
              className={`group relative flex shrink-0 items-center ${expanded ? "justify-start w-full gap-3 px-3 py-2 rounded-md" : "justify-center size-10 rounded-full"} hover:bg-black hover:text-white transition-colors duration-200`}
            >
              <Logout />
              <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"}`}>Logout</span>
            </Link>
          </div>

          <div>
            <Link
              href="/profile"
              onMouseEnter={(e) => showTooltip(e, "Profile")}
              onMouseMove={(e) => showTooltip(e, "Profile")}
              onMouseLeave={hideTooltip}
              className={`group relative flex shrink-0 items-center ${expanded ? "justify-start w-full gap-3 px-3 py-2 rounded-md" : "justify-center size-10 rounded-full"} hover:bg-black hover:text-white transition-colors duration-200`}
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
                className="size-10"
              />
              <span
                className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"}`}
              >
                {authUser?.name ?? "User"}
              </span>
            </Link>
          </div>

          <div
            className={`w-full flex ${expanded ? "justify-end pr-1" : "justify-center"}`}
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
