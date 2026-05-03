"use client";

import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile_photo?: string;
  role_id?: string;
  permissions?: string[];
}

export const useAuth = () => {
  const userQuery = useQuery<AuthUser>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get<AuthUser>("/user");
        return response.data;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch permissions separately and merge with user data if not included
  const permissionsQuery = useQuery<string[]>({
    queryKey: ["auth", "permissions"],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get<{
          permissions?: { name: string }[];
        }>("/roles-permissions/manage-access");
        const perms = response.data?.permissions || [];
        return perms.map((p) => p.name);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return [];
      }
    },
    enabled: !!userQuery.data && !userQuery.data.permissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: userQuery.data
      ? {
          ...userQuery.data,
          permissions: userQuery.data.permissions || permissionsQuery.data || [],
        }
      : undefined,
    isLoading: userQuery.isLoading || permissionsQuery.isLoading,
    error: userQuery.error || permissionsQuery.error,
  };
};
