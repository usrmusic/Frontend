import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface Role {
  id: string;
  name: string;
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
