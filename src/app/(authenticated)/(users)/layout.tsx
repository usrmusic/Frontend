import { ReactNode, Suspense } from "react";
import UsersHeader from "./_components/UsersHeader";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="space-y-4 mt-4">
        <Suspense fallback={<div />}>
          <UsersHeader />
        </Suspense>
        {children}
      </div>
    </>
  );
};

export default layout;
