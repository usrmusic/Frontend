import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { notification } from "antd";

type QueryParams = {
  page: number;
  perPage: number;
  search?: string;
  event_start_time?: string;
  event_end_time?: string;
  year?: number;
};
export const useSuppliersReport = (params: QueryParams) => {
  // Only include keys with truthy values (not empty string, undefined, or null)
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => !!value),
  );

  // Normalize any camelCase keys to snake_case expected by the API
  const normalizedSuppliersParams: Record<string, any> = { ...filteredParams };
  if (Object.prototype.hasOwnProperty.call(normalizedSuppliersParams, 'eventStatus')) {
    normalizedSuppliersParams.event_status = normalizedSuppliersParams.eventStatus;
    delete normalizedSuppliersParams.eventStatus;
  }

  return useQuery({
    queryKey: ["suppliers-report", normalizedSuppliersParams],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get(`/reports/suppliers`, {
          params: normalizedSuppliersParams,
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          notification.error({
            message: "API Error",
            description: msg?.error,
            placement: "topRight",
          });
        } else {
          notification.error({
            message: "Unexpected Error",
            description: "Something went wrong",
            placement: "topRight",
          });
        }
        throw error;
      }
    },
  });
};
export const useAdminReport = (params: QueryParams) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => !!value),
  );
  // Normalize camelCase -> snake_case for admin report params as well
  const normalizedAdminParams: Record<string, any> = { ...filteredParams };
  if (Object.prototype.hasOwnProperty.call(normalizedAdminParams, 'eventStatus')) {
    normalizedAdminParams.event_status = normalizedAdminParams.eventStatus;
    delete normalizedAdminParams.eventStatus;
  }

  return useQuery({
    queryKey: ["admin-report", normalizedAdminParams],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get(`/reports/admin`, {
          params: normalizedAdminParams,
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;

          notification.error({
            message: "API Error",
            description: msg?.error,
            placement: "topRight",
          });
        } else {
          notification.error({
            message: "Unexpected Error",
            description: "Something went wrong",
            placement: "topRight",
          });
        }

        throw error;
      }
    },
  });
};

interface UpdateSupplierPaymentPayload {
  rowType: "equipment" | "dj";
  id: number;
  payment_send: "yes" | "no" | null;
  payment_date: string | null;
}

export const useUpdateSupplierPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rowType, id, payment_send, payment_date }: UpdateSupplierPaymentPayload) => {
      const path = rowType === "dj" ? `/reports/suppliers/dj/${id}/payment` : `/reports/suppliers/equipment/${id}/payment`;
      const response = await AxiosInstance.put(path, { payment_send, payment_date });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-report"], refetchType: "all" });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        notification.error({
          message: "API Error",
          description: error.response?.data?.error,
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Unexpected Error",
          description: "Something went wrong",
          placement: "topRight",
        });
      }
    },
  });
};

interface UpdateAdminReportRowPayload {
  event_id: number;
  extra_cost: number;
  cost: number;
  totalCost: number;
}

export const useUpdateAdminReportRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ event_id, extra_cost, cost, totalCost }: UpdateAdminReportRowPayload) => {
      const response = await AxiosInstance.put(`/reports/admin/${event_id}`, {
        extra_cost,
        cost,
        totalCost,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report"], refetchType: "all" });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        notification.error({
          message: "API Error",
          description: error.response?.data?.error,
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Unexpected Error",
          description: "Something went wrong",
          placement: "topRight",
        });
      }
    },
  });
};
