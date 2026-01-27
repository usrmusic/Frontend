import { AntdRegistry } from "@ant-design/nextjs-registry";
import React from "react";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return <AntdRegistry>{children}</AntdRegistry>;
};

export default ClientProviders;
