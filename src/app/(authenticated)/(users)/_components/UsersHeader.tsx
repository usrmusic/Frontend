"use client";
import Tabs from "./Tabs";
import MobileMenuButton from "@/src/components/common/MobileMenuButton";
import BackLink from "@/src/components/common/BackLink";
import { TitleActionsSlot } from "@/src/components/common/MobileActionsMenu";
import { useSearchParams } from "next/navigation";

const UsersHeader = () => {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Users";
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <BackLink />
        <h2 className="themeH1">{title}</h2>
        {/* Each tab page's phone-only ⋮ menu is portalled in here. */}
        <TitleActionsSlot />
      </div>
      <Tabs />
    </div>
  );
};

export default UsersHeader;
