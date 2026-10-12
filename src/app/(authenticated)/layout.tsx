import { PropsWithChildren, Suspense } from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import LayoutClient from "./LayoutClient";

const layout = async ({ children }: PropsWithChildren) => {
  return (
    <Suspense fallback={<div /> }>
      <LayoutClient>
        <Sidebar />
        <div id="authenticated-content">
          <Header />
          {/* Phone: pages start flush at the top (their title row is the first
              thing on screen — see Header); where the header does show, it
              carries the spacing itself (max-sm:mb-4). */}
          <main className="max-sm:[&>*:first-child]:mt-0!">{children}</main>
        </div>
      </LayoutClient>
    </Suspense>
  );
};

export default layout;
