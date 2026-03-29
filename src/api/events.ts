import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AxiosInstance from "../lib/axios";
import { toast } from "react-toastify";
import { ApiResponse } from "../types/types";

interface EventPayment {
  amount: number;
  date: string; // ISO date string
}

interface User {
  name: string;
  email: string;
  contact_number: string;
}

interface Venue {
  venue: string;
}

type QueryParams = {
  page: number;
  perPage: number;
  search: string;
};

export interface CompletedEvent {
  id: number;
  date: string; // ISO date string
  users_events_user_idTousers: User;
  venues: Venue;
  event_payments: EventPayment[];
  total_cost_for_equipment: string;
  is_event_payment_fully_paid: boolean;
  payment_paid: number;
  payment_paid_date: string; // ISO date string
  payment_remaining: number;
}

export const useGetConfirmEvent = (id: string) => {
  return useQuery({
    queryKey: ["confirm-event", id],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get(`/confirm-event/${id}`);
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
    enabled: !!id,
  });
};
export const useGetCompletedEventsList = (params: QueryParams) => {
  return useQuery({
    queryKey: ["completed-events", params],
    queryFn: async (): Promise<ApiResponse<CompletedEvent>> => {
      try {
        const response = await AxiosInstance.get(`/confirm-event/completed`, {
          params,
        });
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
  });
};

export const useUpdateConfirmEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      try {
        const response = await AxiosInstance.put(
          `/confirm-event/${id}`,
          values,
        );
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["confirm-event", id] });
      toast.success("Event updated successfully");
    },
  });
};
export const useCancelEvent = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/cancel?id=${id}`,
        );
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
      toast.success("Event canceled successfully");
    },
  });
};
export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/download-invoice/${id}`,
        );
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
  });
};
