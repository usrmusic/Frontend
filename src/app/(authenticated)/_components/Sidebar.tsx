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
import { useEffect, useState } from "react";
import AxiosInstance from "@/src/lib/axios";
import { extractUser } from "@/src/lib/user";
import Avatar from "@/src/components/common/Avatar";

const Sidebar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; profile_photo?: string } | null>(null);
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sidebar-expanded') : null;
      return raw === '1';
    } catch {
      return false;
    }
  });

  const handleToggle = (next: boolean) => {
    try {
      localStorage.setItem('sidebar-expanded', next ? '1' : '0');
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { expanded: next } }));
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
    return () => { mounted = false; };
  }, []);

  const links = [
    { href: "/dashboard", icon: <Dashboard />, label: "Dashboard" },
    { href: "/enquiry", icon: <Enquiry />, label: "Enquiry" },
    { href: "/open-enquiry", icon: <MailOpen />, label: "Open Enquiry" },
    { href: "/confirmed-events", icon: <Reports />, label: "Confirmed Events" },
    { href: "/completed-events", icon: <TbReportSearch />, label: "Completed Events" },
    { href: "/calendar", icon: <Calendar />, label: "Calendar" },
    { href: "/suppliers-report", icon: <TbReportMedical />, label: "Suppliers Report" },
    { href: "/admin-report", icon: <TbReportAnalytics />, label: "Admin Report" },
    { href: "/users?title=Users", icon: <Contacts />, label: "Users" },
    { href: "/downloads", icon: <TbFileDownload />, label: "Downloads" },
    { href: "/file-upload", icon: <TbFileUpload />, label: "File Upload" },
    { href: "/rig-list", icon: <RiFileListLine />, label: "Rig List" },
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
    <div
      className={`fixed overflow-hidden no-scrollbar top-12.5 bottom-12.5 left-12 bg-secondary-50 flex flex-col gap-6 py-5 rounded-[50px] transition-all duration-300 ease-in-out ${expanded ? 'w-60 items-start px-4' : 'w-20  items-center'} z-50`}
      aria-expanded={expanded}
    >
      {/* apply mt-auto to only the third-last direct child */}
      <div className={`flex flex-col ${expanded ? 'gap-4 w-full' : 'gap-3'} h-full [&>*:nth-last-child(3)]:mt-auto `}>
        {links.map((item, index) => {
          const isActive = pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              id={`sidebar-link-${index}`}
              key={index}
              href={item.href}
              onClick={item.onClick ? item.onClick : undefined}
              className={`flex shrink-0 items-center ${expanded ? 'justify-start w-full gap-3 px-3 py-2 rounded-md' : 'justify-center size-10 rounded-full'} hover:bg-black hover:text-white transition-colors duration-200 ${isActive ? 'bg-black text-white' : ''}`}
            >
              {item.icon}
              <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? 'max-w-[200px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>{item.label}</span>
            </Link>
          );
        })}
        <div>
          <div className={`flex items-center ${expanded ? 'gap-3' : ''} ${expanded ? 'pl-1' : ''}`}>
            <Avatar
              src={getImageSrc(user?.profile_photo)}
              initials={user?.name ? user.name.split(" ").map(n => n[0]).slice(0,2).join("") : "U"}
              size={40}
              className="size-10"
            />
            <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>{user?.name ?? 'User'}</span>
          </div>
        </div>
        <div className={`w-full flex ${expanded ? 'justify-end pr-1' : 'justify-center'}`}> 
          <button
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => { setExpanded((s) => { const n = !s; handleToggle(n); return n; }); }}
            className={`border border-1 size-10 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-colors duration-200 ${expanded ? 'bg-black text-white' : ''}`}
          >
            <span aria-hidden>{expanded ? '‹' : '›'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function getImageSrc(p?: string) {
  if (!p) return undefined;
  if (/^(data:|https?:\/\/|\/\/)/i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return `/${p}`;
}

export default Sidebar;
