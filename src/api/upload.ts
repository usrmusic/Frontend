import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiResponse } from "../types/types";

interface QueryParams {
  page: number;
  perPage: number;
  search: string;
}

interface Upload {
  id: number;
  file_name: string;
  file_type: string;
  created_at: string;
  event: string;
  event_id?: number | null;
}

export const useUploadList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["uploads-list", params],
    queryFn: async (): Promise<ApiResponse<Upload>> => {
      const response = await AxiosInstance.get(`/files/uploads`, {
        params,
      });
      return response.data;
    },
  });
};

export const useMyUploadList = () => {
  return useQuery({
    queryKey: ["uploads-mine"],
    queryFn: async (): Promise<ApiResponse<Upload>> => {
      const response = await AxiosInstance.get(`/files/uploads/mine`);
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
      queryClient.invalidateQueries({ queryKey: ["uploads-list"] }),
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

export const useDownloadUpload = () => {
  return useMutation({
    mutationFn: async (
      id: number | string,
    ): Promise<{ blob: Blob; filename: string }> => {
      const response = await AxiosInstance.get(
        `/files/uploads/${id}/download`,
        { responseType: "blob" },
      );
      // Extract filename from Content-Disposition header if available
      const cd = response.headers["content-disposition"] as string | undefined;
      let filename = "download";
      if (cd) {
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match?.[1]) {
          filename = decodeURIComponent(match[1].replace(/['"]/g, ""));
        }
      }
      return { blob: response.data as Blob, filename };
    },
    // No onError here — callers use mutateAsync and handle errors in their own catch blocks
  });
};

// Ownership-checked counterpart used by clients, who lack the "file upload"
// permission required by /files/uploads/:id/download.
export const useDownloadMyUpload = () => {
  return useMutation({
    mutationFn: async (
      id: number | string,
    ): Promise<{ blob: Blob; filename: string }> => {
      const response = await AxiosInstance.get(
        `/files/uploads/mine/${id}/download`,
        { responseType: "blob" },
      );
      const cd = response.headers["content-disposition"] as string | undefined;
      let filename = "download";
      if (cd) {
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match?.[1]) {
          filename = decodeURIComponent(match[1].replace(/['"]/g, ""));
        }
      }
      return { blob: response.data as Blob, filename };
    },
  });
};