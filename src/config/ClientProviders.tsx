"use client";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import React from "react";
import ThemeConfig from "./ThemeConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();

  return (
    <AntdRegistry>
      <ThemeConfig>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeConfig>
    </AntdRegistry>
  );
};

export default ClientProviders;
