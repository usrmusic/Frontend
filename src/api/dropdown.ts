import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface Role {
  id: string;
  name: string;
}

interface DjDropdown {
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
export const useDjDropdown = () => {
  return useQuery({
    queryKey: ["dj-dropdown"],
    queryFn: async (): Promise<DjDropdown[]> => {
      const response = await AxiosInstance.get("/user/get-dropdown");
      return response.data;
    },
  });
};
