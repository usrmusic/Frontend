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
        const response = await AxiosInstance.delete(`/files/media/${id}`);
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

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await AxiosInstance.post(`/files/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads-list"] }),
    onError: (err) => {
      console.error(err);
      toast.error("Upload failed");
    },
  });
};

export const useDownloadMedia = () => {
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await AxiosInstance.get(`/files/media/${id}`);
      return response.data;
    },
    onError: (err) => {
      console.error(err);
      toast.error("Download failed");
    },
  });
};
