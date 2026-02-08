"use client";
import Tabs from "./Tabs";
import { BackButton } from "@/src/components/Icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const UsersHeader = () => {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Users";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="">
          <BackButton />
        </Link>
        <h2 className="themeH1">{title}</h2>
      </div>
      <Tabs />
    </div>
  );
};

export default UsersHeader;
