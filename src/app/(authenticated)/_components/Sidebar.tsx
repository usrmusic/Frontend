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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteCookie } from "cookies-next";

const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      icon: <Dashboard />,
    },
    {
      href: "/enquiry",
      icon: <Enquiry />,
    },
    {
      href: "/open-enquiry",
      icon: <MailOpen />,
    },
    {
      href: "/confirmed-events",
      icon: <Reports />,
    },
    {
      href: "/completed-events",
      icon: <TbReportSearch />,
    },
    {
      href: "/calendar",
      icon: <Calendar />,
    },
    {
      href: "/suppliers-report",
      icon: <TbReportMedical />,
    },
    {
      href: "/admin-report",
      icon: <TbReportAnalytics />,
    },
    {
      href: "/users?title=Users",
      icon: <Contacts />,
    },
    {
      href: "/downloads",
      icon: <TbFileDownload />,
    },
    {
      href: "/file-upload",
      icon: <TbFileUpload />,
    },
    {
      href: "/rig-list",
      icon: <RiFileListLine />,
    },

    {
      href: "/login",
      icon: <Logout />,
      onClick: () => {
        deleteCookie("token");
      },
    },
  ];

  return (
    <div className="fixed overflow-auto no-scrollbar top-12.5 bottom-12.5 left-12 bg-secondary-50 w-19.5 rounded-full flex flex-col items-center gap-10 py-5">
      {/* apply mt-auto to only the third-last direct child */}
      <div className="flex flex-col gap-3 h-full [&>*:nth-last-child(3)]:mt-auto">
        {links.map((item, index) => {
          const isActive = pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              id={`sidebar-link-${index}`}
              key={index}
              href={item.href}
              onClick={item.onClick ? item.onClick : undefined}
              className={`size-10 flex shrink-0 items-center justify-center rounded-full hover:bg-black! hover:text-white transition-all duration-300 ${
                isActive ? "bg-black text-white" : ""
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
        <div>
          <Image
            src={"/images/avatar.png"}
            alt="avatar"
            width={40}
            height={40}
            className="size-10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
