"use client";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import React from "react";
import ThemeConfig from "./ThemeConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute - data considered fresh
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnReconnect: true, // Only refetch on reconnect
        refetchOnMount: false, // Use cached data if available
        refetchInterval: false, // Disable polling by default
        networkMode: "online", // Only fetch when online
      },
      mutations: {
        retry: 0,
        networkMode: "online",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
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
