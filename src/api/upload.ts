import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface QueryParams {
  page: number;
  perPage: number;
  search: string;
}

export const useUploadList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["downloads-list", params],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/files/uploads`, {
        params,
      });
      return response.data;
    },
  });
};
