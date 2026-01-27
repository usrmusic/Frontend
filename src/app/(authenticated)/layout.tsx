import { PropsWithChildren } from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";

const layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="p-6">
      <div className="bg-secondary-200 rounded-3xl min-h-[calc(100vh-48px)] p-8">
        <Sidebar />
        <div className="ml-25">
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default layout;
