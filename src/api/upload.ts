import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

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

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await AxiosInstance.post(`/files/uploads`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads-list"] }),
    onError: (err: any) => {
      console.error(err);
      toast.error("Upload failed");
    },
  });
};

export const useUpdateUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: any }) => {
      const response = await AxiosInstance.put(`/files/uploads/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads-list"] }),
    onError: (err: any) => {
      console.error(err);
      toast.error("Update failed");
    },
  });
};

export const useDeleteUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await AxiosInstance.delete(`/files/uploads/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads-list"] }),
    onError: (err: any) => {
      console.error(err);
      toast.error("Delete failed");
    },
  });
};

export const useDownloadUpload = () => {
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await AxiosInstance.get(`/files/uploads/${id}/download`);
      return response.data;
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Failed to get download URL");
    },
  });
};
