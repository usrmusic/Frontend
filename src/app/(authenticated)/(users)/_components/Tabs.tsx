"use client";
import Button from "@/src/components/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabData = [
  { label: "Users", href: "/users?title=Users", className: "w-23.5" },
  { label: "Clients", href: "/clients?title=Clients", className: "w-23.5" },
  { label: "Venues", href: "/venues?title=Venues", className: "w-23.5" },
  {
    label: "Suppliers",
    href: "/suppliers?title=Suppliers",
    className: "w-23.5",
  },
  { label: "Packages", href: "/packages?title=Packages", className: "w-23.5" },
  { label: "Company", href: "/company?title=Company", className: "w-23.5" },
  {
    label: "DJ Colours",
    href: "/dj-colours?title=DJ%20Colours",
    className: "w-28",
  },
  {
    label: "Manage Access",
    href: "/manage-access?title=Manage%20Access",
    className: "w-33.75",
  },
  { label: "Email", href: "/email?title=Email", className: "w-23.5" },
];

const Tabs = () => {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {tabData.map((tab) => {
        // Extract the pathname without query params for matching
        const tabPath = tab.href.split("?")[0];
        // check if the pathname starts with the tab path
        const isActive = pathname.startsWith(tabPath);

        return (
          <Link href={tab.href} key={tab.href}>
            <Button
              type={isActive ? "primary" : undefined}
              className={tab.className}
            >
              {tab.label}
            </Button>
          </Link>
        );
      })}
      {/* <button className="w-7.5 flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
        <MoreVertical size={18} />
      </button> */}
    </div>
  );
};

export default Tabs;
