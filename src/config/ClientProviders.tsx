import { AntdRegistry } from "@ant-design/nextjs-registry";
import React from "react";
import ThemeConfig from "./ThemeConfig";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AntdRegistry>
      <ThemeConfig>{children}</ThemeConfig>
    </AntdRegistry>
  );
};

export default ClientProviders;
