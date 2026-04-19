import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { toast } from "react-toastify";

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
      try {
        const response = await AxiosInstance.delete(`/uploads/${id}`);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "API Error");
        } else {
          toast.error("Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads-list"] });
    },
  });
};
