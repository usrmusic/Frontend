import { PropsWithChildren } from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import LayoutClient from "./LayoutClient";

const layout = async ({ children }: PropsWithChildren) => {
  return (
    <LayoutClient>
      <Sidebar />
      <div id="authenticated-content">
        <Header />
        <main>{children}</main>
      </div>
    </LayoutClient>
  );
};

export default layout;
