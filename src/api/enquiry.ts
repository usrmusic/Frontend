import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

export const useSingleClient = (id: number | null) => {
  return useQuery({
    queryKey: ["client-item", id],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/client/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
};
