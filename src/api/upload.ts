import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";

interface QueryParams {
  page: number;
  perPage: number;
  search: string;
}

export const useUploadList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["uploads-list", params],
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["uploads-list"] }),
    onError: (err) => {
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["uploads-list"] }),
    onError: (err) => {
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["downloads-list"] }),
    onError: (err) => {
      console.error(err);
      toast.error("Delete failed");
    },
  });
};

// export const useDownloadUpload = () => {
//   return useMutation({
//     mutationFn: async (id: number | string) => {
//       try {
//         const response = await AxiosInstance.get(`/files/uploads/${id}/download`);
//         return response.data;
//       } catch (error: unknown) {
//         if (axios.isAxiosError(error)) {
//           const msg = error.response?.data;
//           const message = typeof msg === "object" ? msg?.error : msg;
//           toast.error(message || "API Error");
//         } else {
//           toast.error("Something went wrong");
//         }
//         throw error;
//       }
//     },
//   });
// };


// src/api/upload.ts

// src/api/upload.ts — update the hook return type
export const useDownloadUpload = () => {
  return useMutation({
    mutationFn: async (id: number | string): Promise<{
      url?: string;
      download_url?: string;
      filename?: string;       // ← add this
      storage?: string;
    }> => {
      const response = await AxiosInstance.get(`/files/uploads/${id}/download`);
      return response.data;
    },
    onError: () => {
      toast.error("Download failed");
    },
  });
};