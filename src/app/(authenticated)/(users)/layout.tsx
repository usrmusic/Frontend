import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import UsersHeader from "./_components/UsersHeader";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="space-y-4 mt-4">
        <UsersHeader />
        {children}
      </div>
    </>
  );
};

export default layout;
