import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { notification } from "antd";

export type Permission = {
  id: string | number;
  name: string;
  guard_name?: string | null;
  [key: string]: any;
};

export const usePermissions = () => {
  return useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      try {
        const resp = await AxiosInstance.get<Permission[]>("/roles-permissions/permissions");
        return resp.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = (error.response?.data as any)?.message || "Failed to load permissions";
          notification.error({ message: "API Error", description: msg });
        }
        throw error;
      }
    },
  });
};

export const useRolePermissions = (roleId?: string | number) => {
  return useQuery<Permission[]>({
    queryKey: ["role-permissions", roleId],
    queryFn: async () => {
      if (!roleId) return [];
      try {
        const resp = await AxiosInstance.get<Permission[]>(`/roles-permissions/roles/${roleId}/permissions`);
        return resp.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = (error.response?.data as any)?.message || "Failed to load role permissions";
          notification.error({ message: "API Error", description: msg });
        }
        throw error;
      }
    },
    enabled: !!roleId,
  });
};

export const useAssignRolePermissions = (roleId?: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { permissions: Array<string | number> }) => {
      if (!roleId) throw new Error("roleId required");
      try {
        const resp = await AxiosInstance.post(`/roles-permissions/roles/${roleId}/permissions`, payload);
        return resp.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = (error.response?.data as any)?.message || "Failed to assign permissions";
          notification.error({ message: "API Error", description: msg });
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["manage-access"], refetchType: "all" });
      notification.success({ message: "Permissions updated" });
    },
  });
};

export const useAssignPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { roleId: string | number; permissionIds: Array<string | number> }) => {
      try {
        const resp = await AxiosInstance.post(`/roles-permissions/assign`, payload);
        return resp.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = (error.response?.data as any)?.message || "Failed to assign permissions";
          notification.error({ message: "API Error", description: msg });
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["manage-access"], refetchType: "all" });
      notification.success({ message: "Permissions assigned" });
    },
  });
};
