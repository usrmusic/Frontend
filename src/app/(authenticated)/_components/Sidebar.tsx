"use client";

import {
  Calendar,
  Contacts,
  Dashboard,
  Enquiry,
  Logout,
  MailOpen,
  Reports,
  Settings,
} from "@/src/components/Icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      href: "#",
      icon: <MailOpen />,
    },
    {
      href: "#",
      icon: <Reports />,
    },
    {
      href: "#",
      icon: <Calendar />,
    },
    {
      href: "#",
      icon: <Contacts />,
    },
    {
      href: "#",
      icon: <Settings />,
    },
    {
      href: "#",
      icon: <Logout />,
    },
  ];

  return (
    <div className="fixed top-12.5 bottom-12.5 left-12 bg-secondary-50 w-19.5 rounded-full flex flex-col items-center gap-10 py-5">
      <div className="flex flex-col gap-3 h-full [&_#sidebar-link-5]:mt-auto">
        {links.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              id={`sidebar-link-${index}`}
              key={index}
              href={item.href}
              className={`size-10 flex items-center justify-center rounded-full hover:bg-black! hover:text-white transition-all duration-300 ${
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
