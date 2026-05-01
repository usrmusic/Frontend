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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import AxiosInstance from "@/src/lib/axios";
import { extractUser } from "@/src/lib/user";
import Avatar from "@/src/components/common/Avatar";

const Sidebar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<{
    name?: string;
    profile_photo?: string;
  } | null>(null);
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
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("sidebar-expanded")
          : null;
      return raw === "1";
    } catch {
      return false;
    }
  });

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

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const resp = await AxiosInstance.get<unknown>("/user");
        const raw = resp?.data as unknown;
        const parsed = extractUser(raw);
        if (mounted && parsed) setUser(parsed);
      } catch {
        // ignore
      }
    }
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

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

  const links = [
    { href: "/dashboard", icon: <Dashboard />, label: "Dashboard" },
    { href: "/enquiry", icon: <Enquiry />, label: "Enquiry" },
    { href: "/open-enquiry", icon: <MailOpen />, label: "Open Enquiry" },
    { href: "/confirmed-events", icon: <Reports />, label: "Confirmed Events" },
    {
      href: "/completed-events",
      icon: <TbReportSearch size={20} />,
      label: "Completed Events",
    },
    { href: "/calendar", icon: <Calendar />, label: "Calendar" },
    {
      href: "/suppliers-report",
      icon: <TbReportMedical size={20} />,
      label: "Suppliers Report",
    },
    {
      href: "/admin-report",
      icon: <TbReportAnalytics size={20} />,
      label: "Admin Report",
    },
    { href: "/users?title=Users", icon: <Contacts />, label: "Users" },
    {
      href: "/downloads",
      icon: <TbFileDownload size={20} />,
      label: "Downloads",
    },
    {
      href: "/file-upload",
      icon: <TbFileUpload size={20} />,
      label: "File Upload",
    },
    {
      href: "/rig-list",
      icon: <RiFileListLine size={20} />,
      label: "Rig List",
    },
    {
      href: "/login",
      icon: <Logout />,
      label: "Logout",
      onClick: () => {
        deleteCookie("token");
      },
    },
  ];

  return (
    <>
      <div
        className={`fixed no-scrollbar overflow-x-hidden top-12.5 bottom-12.5 left-12 bg-secondary-50 flex flex-col gap-6 py-5 rounded-[50px] transition-all duration-300 ease-in-out ${expanded ? "w-60 items-start px-4" : "w-20  items-center"} z-50`}
        aria-expanded={expanded}
      >
        {/* apply mt-auto to only the third-last direct child */}
        <div
          className={`flex flex-col ${expanded ? "gap-4 w-full" : "gap-3"} h-full overflow-y-auto overflow-x-hidden no-scrollbar [&>*:nth-last-child(3)]:mt-auto `}
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {links.map((item, index) => {
            const isActive = pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                id={`sidebar-link-${index}`}
                key={index}
                href={item.href}
                onClick={item.onClick ? item.onClick : undefined}
                onMouseEnter={(e) => showTooltip(e, item.label)}
                onMouseMove={(e) => showTooltip(e, item.label)}
                onMouseLeave={hideTooltip}
                // title={!expanded ? item.label : undefined}
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
          <div>
            <div
              className={`flex items-center ${expanded ? "gap-3" : ""} ${expanded ? "pl-1" : ""}`}
            >
              <Avatar
                src={getImageSrc(user?.profile_photo)}
                initials={
                  user?.name
                    ? user.name
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
                {user?.name ?? "User"}
              </span>
            </div>
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
