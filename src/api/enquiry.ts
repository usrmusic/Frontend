import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import { ApiResponse } from "../types/types";
import axios from "axios";
import { toast } from "react-toastify";

interface QueryParams {
  page: number;
  limit: number;
}

interface PackageParams {
  event_date: string;
  staff: number | null;
  package_name: string;
}

interface OpenEnquiryList {
  name: string;
  mobile: string;
  event_date: string;
}

interface SendBrochurePayload {
  event_id: number;
  body: string;
  subject: string;
  company_name_id: string;
}

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
export const usePackageData = (params: PackageParams) => {
  const isEnabled = Object.values(params).every(
    (value) => value !== undefined && value !== null && value !== "",
  );
  return useQuery({
    queryKey: ["package-data", params],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/enquiry/staff-equipment`, {
        params,
      });
      return response.data;
    },
    enabled: isEnabled,
  });
};
export const useOpenEnquiryList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["enquiry-list", params],
    queryFn: async (): Promise<ApiResponse<OpenEnquiryList>> => {
      try {
        const response = await AxiosInstance.get(`/enquiry`, {
          params,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
  });
};

export const useSendBrochure = () => {
  return useMutation({
    mutationFn: async (payload: SendBrochurePayload) => {
      try {
        const response = await AxiosInstance.post(`/enquiry/brochure`, payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onError: (error) => {
      console.error("add supplier failed:", error.message);
    },
  });
};
export const useSendQuote = () => {
  return useMutation({
    mutationFn: async (payload: SendBrochurePayload) => {
      try {
        const response = await AxiosInstance.post(`/enquiry/quote`, payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onError: (error) => {
      console.error("add supplier failed:", error.message);
    },
  });
};
export const useSendInvoice = () => {
  return useMutation({
    mutationFn: async (payload: SendBrochurePayload) => {
      try {
        const response = await AxiosInstance.post(`/confirm-event/send-invoice`, payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onError: (error) => {
      console.error("send invoice failed:", error.message);
    },
  });
};
export const useAddNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (param: { note: string; id: number }) => {
      try {
        const { note, id } = param;
        const response = await AxiosInstance.post(`/enquiry/add-note/${id}`, {
          note,
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"] });
    },
    onError: (error) => {
      console.error("add supplier failed:", error.message);
    },
  });
};

export const useCreateEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      try {
        const response = await AxiosInstance.post(`/enquiry`, payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"] });
      toast.success("Enquiry created successfully");
      return data;
    },
    onError: (error: any) => {
      console.error("create enquiry failed:", error?.message || error);
    },
  });
};
