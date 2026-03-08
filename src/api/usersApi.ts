import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

type ClientsQueryParams = {
  page: number;
  perPage: number;
  name?: string;
};

export const useClients = (params?: ClientsQueryParams) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await AxiosInstance.get("/client", { params });
      return response.data;
    },
    enabled: !!params,
  });
};
