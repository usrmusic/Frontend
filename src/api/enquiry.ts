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

import type { ConfirmEventNote } from "@/src/types/types";
import { invalidateAllStats } from "../lib/invalidateStats";

export interface OpenEnquiryList {
  id: string | number;
  name: string;
  mobile: string;
  event_date: string;
  event_notes?: ConfirmEventNote[];
  [key: string]: unknown;
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

// Business-wide event counts (Total / Open / Closed) — not scoped to this
// page's own open-enquiry dataset. Open = OPEN + CONFIRMED (booked but not
// yet finished), Closed = COMPLETED + CANCELLED. See getStatusCounts in
// enquiry.controller.js for the exact status-id grouping.
export interface StatusCounts {
  total: number;
  open: number;
  closed: number;
}
export const useEnquiryStatusCounts = () => {
  return useQuery({
    queryKey: ["enquiry-status-counts"],
    queryFn: async (): Promise<StatusCounts> => {
      const response = await AxiosInstance.get(`/enquiry/status-counts`);
      return response.data;
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

export const fetchEmailTemplate = async (event_id: string | number, email_name: string) => {
  try {
    const response = await AxiosInstance.get(`/enquiry/get-email`, {
      params: { event_id: String(event_id), email_name },
    });
    return response.data?.data ?? null;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data;
      toast.error(msg?.error || "Something went wrong");
    }
    throw error;
  }
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
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"], refetchType: "all" });
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
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["enquiry-status-counts"], refetchType: "all" });
      // Creating an enquiry can create a brand new client record — without
      // these, the Clients page and the New Enquiry autocomplete both kept
      // showing stale data until something unrelated forced a refetch.
      queryClient.invalidateQueries({ queryKey: ["clients"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["client-dropdown"], refetchType: "all" });
      invalidateAllStats(queryClient);
      toast.success("Enquiry created successfully");
      return data;
    },
    onError: (error: any) => {
      console.error("create enquiry failed:", error?.message || error);
    },
  });
};

export const useGetEnquiry = (id?: string | number) => {
  return useQuery({
    queryKey: ["enquiry-item", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await AxiosInstance.get(`/enquiry/${String(id)}`);
      return response.data?.data ?? null;
    },
    enabled: Boolean(id),
  });
};

export const useUpdateEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number | string; body: Record<string, unknown> }) => {
      try {
        const response = await AxiosInstance.put(`/enquiry/${id}`, body);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"], refetchType: "all" });
      // Global query defaults have refetchOnMount:false, so plain
      // invalidateQueries() only marks an INACTIVE query (e.g. this enquiry's
      // edit page, already unmounted after a successful save + navigate
      // away) stale without actually refetching it — a later remount would
      // just serve that stale pre-update snapshot again, forever, since
      // refetchOnMount:false skips the mount-time staleness check too.
      // `refetchType: "all"` (same pattern already used for the reset-vs-
      // hydrate race in enquiry/page.tsx) forces the refetch immediately
      // regardless of whether anything is currently observing it, so
      // re-opening this enquiry for edit reliably shows what was just saved.
      queryClient.invalidateQueries({
        queryKey: ["enquiry-item", variables.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({ queryKey: ["enquiry-status-counts"], refetchType: "all" });
      // Editing an enquiry can also update the linked client's own details.
      queryClient.invalidateQueries({ queryKey: ["clients"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["client-dropdown"], refetchType: "all" });
      invalidateAllStats(queryClient);
    },
    onError: (error: any) => {
      console.error("update enquiry failed:", error?.message || error);
    },
  });
};

export const useDeleteEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      try {
        const response = await AxiosInstance.delete(`/enquiry/${id}`);
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
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["enquiry-status-counts"], refetchType: "all" });
      invalidateAllStats(queryClient);
    },
  });
};

export const useEditEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number | string; body: Record<string, unknown> }) => {
      try {
        const response = await AxiosInstance.put(`/enquiry/${id}`, body);
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
      queryClient.invalidateQueries({ queryKey: ["enquiry-list"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["enquiry-status-counts"], refetchType: "all" });
      invalidateAllStats(queryClient);
    },
  });
};
