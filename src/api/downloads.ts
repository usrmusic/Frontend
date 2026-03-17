import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface QueryParams {
  page: number;
  perPage: number;
  search: string;
}

export const useDownloadsList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["downloads-list", params],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/files/media`, {
        params,
      });
      return response.data;
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await AxiosInstance.delete(`/uploads/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads-list"] });
    },
  });
};
