import { PropsWithChildren } from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import { auth0 } from "@/src/lib/auth0";

const layout = async ({ children }: PropsWithChildren) => {
  const session = await auth0.getSession();

  return (
    <div className="p-6">
      <div className="bg-secondary-200 rounded-3xl min-h-[calc(100vh-48px)] p-8 overflow-y-auto max-h-[calc(100vh-48px)]">
        <Sidebar />
        <div className="ml-25">
          <Header session={session} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default layout;
