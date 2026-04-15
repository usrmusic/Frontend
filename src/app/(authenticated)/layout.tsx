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
          <main>{children}</main>
        </div>
      </LayoutClient>
    </Suspense>
  );
};

export default layout;
