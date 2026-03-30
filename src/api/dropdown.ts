import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface Role {
  id: string;
  name: string;
}

interface UserDropdown {
  id: number;
  name: string;
  package_users: { id: string; package_name: string }[];
}

export const useRoleDropdown = () => {
  return useQuery({
    queryKey: ["role-dropdown"],
    queryFn: async (): Promise<Role[]> => {
      const response = await AxiosInstance.get("/user/roles");
      return response.data;
    },
  });
};
export const useClientDropdown = () => {
  return useQuery({
    queryKey: ["client-dropdown"],
    queryFn: async (): Promise<{ id: number; name: string }[]> => {
      const response = await AxiosInstance.get("/client/get-dropdown");
      return response.data;
    },
  });
};
export const useVenueDropdown = () => {
  return useQuery({
    queryKey: ["venue-dropdown"],
    queryFn: async (): Promise<{ id: number; venue: string }[]> => {
      const response = await AxiosInstance.get("/venue/get-dropdown");
      return response.data;
    },
  });
};
export const useUsersDropdown = () => {
  return useQuery({
    queryKey: ["user-dropdown"],
    queryFn: async (): Promise<UserDropdown[]> => {
      const response = await AxiosInstance.get("/user/get-dropdown");
      return response.data;
    },
  });
};
export const useCompanyDropdown = () => {
  return useQuery({
    queryKey: ["company-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/company/get-dropdown");
      return response.data;
    },
  });
};
export const useRigListEventsDropdown = () => {
  return useQuery({
    queryKey: ["events-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/rig-list/drop-down");
      return response.data;
    },
  });
};
export const useEquipmentDropdown = () => {
  return useQuery({
    queryKey: ["equipment-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/equipment/get-dropdown");
      return response.data;
    },
  });
};
