import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AxiosInstance from "../lib/axios";
import { toast } from "react-toastify";
import { ApiResponse } from "../types/types";
import { TodoFormValues } from "../app/(authenticated)/confirmed-events/_components/TodoModal";

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
  paymentStatus?: string;
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

interface ConfirmEventPayload {
  payment_method_id: number;
  deposit_amount: number;
  company_name: string;
  event_date: string;
}

export interface TodoRespI {
  id: number;
  event_id?: number;
  assigned_to: number | string | null;
  users_todos_assigned_toTousers?: { id: number; name: string } | null;
  assigned_user_name?: string | null;
  action: string;
  deadline: string;
  comment: string;
  complete: boolean;
  created_by?: number | string | null;
  users_todos_created_byTousers?: { id: number; name: string } | null;
  created_user_name?: string | null;
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
    },
  });
};
export const useCancelEvent = () => {
  const queryClient = useQueryClient();
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
    onSuccess: (_, { id }) => {
      // Invalidate confirm-event detail and dropdown lists so cancelled event disappears
      try {
        queryClient.invalidateQueries({ queryKey: ["confirm-event", id] });
      } catch (e) {}
      try {
        queryClient.invalidateQueries({ queryKey: ["events-dropdown"] });
      } catch (e) {}
      toast.success("Event canceled successfully");
    },
  });
};
export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      try {
        // Request as blob so we can handle both PDF and JSON fallback payloads
        const response = await AxiosInstance.post(
          `/confirm-event/download-invoice/${id}`,
          undefined,
          {
            responseType: "blob",
            headers: { Accept: "application/pdf, application/json" },
          },
        );

        const contentType = String(response.headers?.["content-type"] || "");

        // Case 1: API directly returns PDF bytes
        if (contentType.includes("application/pdf")) {
          if (typeof window !== "undefined") {
            // response.data should be a Blob; validate PDF header before download
            const blobData = response.data as Blob;
            const ab = await blobData.arrayBuffer();
            const header = String.fromCharCode.apply(
              null,
              new Uint8Array(ab.slice(0, 4)) as unknown as number[],
            );
            if (!header.includes("%PDF")) {
              // not a valid PDF — surface the body for debugging
              const text = await blobData.text();
              console.error(
                "downloadInvoice: received non-PDF response:",
                text,
              );
              toast.error(
                "Invoice generation failed (server returned non-PDF)",
              );
              return false;
            }

            const blob = new Blob([ab], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }
          return true;
        }

        // Case 2: API returns JSON (for envs that send buffer/url wrapper)
        const text = await response.data.text();
        let parsed: any = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = null;
        }

        const base64 =
          parsed?.pdfBuffer ||
          parsed?.data?.pdfBuffer ||
          parsed?.buffer ||
          parsed?.data?.buffer ||
          null;
        const pdfUrl = parsed?.pdfUrl || parsed?.data?.pdfUrl || null;

        if (pdfUrl && typeof window !== "undefined") {
          window.open(String(pdfUrl), "_blank", "noopener,noreferrer");
          return true;
        }

        if (base64 && typeof window !== "undefined") {
          let blob: Blob | null = null;

          // Case A: base64 is a string (possibly data URL)
          if (typeof base64 === "string") {
            const cleaned = base64
              .replace(/^data:application\/pdf;base64,/, "")
              .trim();

            const isLikelyBase64 = (s: string) => {
              const noWs = s.replace(/\s+/g, "");
              if (noWs.length === 0) return false;
              if (noWs.length % 4 !== 0) return false;
              return /^[A-Za-z0-9+/]+=*$/.test(noWs);
            };

            if (isLikelyBase64(cleaned)) {
              try {
                const binary = atob(cleaned.replace(/\s+/g, ""));
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i += 1)
                  bytes[i] = binary.charCodeAt(i);
                blob = new Blob([bytes], { type: "application/pdf" });
              } catch (e) {
                console.warn("atob failed despite base64 check", e);
              }
            } else if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
              // Probably a JSON array/object encoded as string
              try {
                const parsedInner = JSON.parse(cleaned);
                if (Array.isArray(parsedInner)) {
                  const bytes = new Uint8Array(
                    parsedInner.map((n: any) => Number(n) || 0),
                  );
                  blob = new Blob([bytes], { type: "application/pdf" });
                } else if (
                  typeof parsedInner === "object" &&
                  parsedInner !== null
                ) {
                  const vals = Object.keys(parsedInner)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((k) => Number((parsedInner as any)[k]) || 0);
                  const bytes = new Uint8Array(vals);
                  blob = new Blob([bytes], { type: "application/pdf" });
                }
              } catch (e) {
                console.warn("String looked like JSON but failed to parse", e);
              }
            } else if (/^\s*\d+(?:\s*,\s*\d+)+\s*$/.test(cleaned)) {
              // Format: "37,80,68,70,..." - comma-separated byte values in a string
              try {
                const vals = cleaned
                  .split(",")
                  .map((s) => Number(s.trim()) || 0);
                const bytes = new Uint8Array(vals);
                blob = new Blob([bytes], { type: "application/pdf" });
                console.info(
                  "Parsed comma-separated pdfBuffer into blob (length)",
                  bytes.length,
                );
              } catch (e) {
                console.warn(
                  "Failed to parse comma-separated pdfBuffer string",
                  e,
                );
              }
            } else {
              console.warn(
                "Unrecognized pdfBuffer string format; not base64 or JSON array/object",
              );
            }
          } else if (Array.isArray(base64)) {
            // Case B: backend returned array of byte values
            const bytes = new Uint8Array(
              base64.map((n: any) => Number(n) || 0),
            );
            blob = new Blob([bytes], { type: "application/pdf" });
          } else if (typeof base64 === "object") {
            // Case C: backend returned an object with numeric keys {0:37,1:80,...}
            try {
              const vals = Object.keys(base64)
                .sort((a, b) => Number(a) - Number(b))
                .map((k) => Number((base64 as any)[k]) || 0);
              const bytes = new Uint8Array(vals);
              blob = new Blob([bytes], { type: "application/pdf" });
            } catch (e) {
              console.error("Failed to convert object-like buffer to bytes", e);
            }
          }

          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return true;
          }
        }

        toast.error("Invoice download failed");
        return false;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const responseData = error.response?.data;
          if (responseData instanceof Blob) {
            try {
              const text = await responseData.text();
              const parsed = text ? JSON.parse(text) : null;
              toast.error(parsed?.error || "API Error");
            } catch {
              toast.error("API Error");
            }
          } else {
            const msg = responseData as { error?: string } | undefined;
            toast.error(msg?.error || "API Error");
          }
        } else {
          toast.error("Something went wrong");
        }
        throw error;
      }
    },
  });
};
export const useConfirmEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ConfirmEventPayload;
    }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/${id}`,
          payload,
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
      try {
        queryClient.invalidateQueries({ queryKey: ["enquiry-list"] });
      } catch (e) {}
      try {
        queryClient.invalidateQueries({ queryKey: ["events-dropdown"] });
      } catch (e) {}
    },
  });
};

export const useAddConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { payment_method_id?: number; amount: number; date: string; notes?: string };
    }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/payment?id=${id}`,
          payload,
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
      toast.success("Payment added successfully");
    },
  });
};

export const useGetTodos = (eventId: number = 423) => {
  return useQuery({
    queryKey: ["todos-list", eventId],
    queryFn: async (): Promise<TodoRespI[]> => {
      try {
        const resp = await AxiosInstance.get(`/todos/${eventId}`);
        return resp.data;
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
export const useAddTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: number;
      payload: TodoFormValues;
    }) => {
      try {
        const resp = await AxiosInstance.post(`/todos/${eventId}`, payload);
        return resp.data;
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
      queryClient.invalidateQueries({ queryKey: ["todos-list"] });
    },
  });
};
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      todoId,
    }: {
      eventId: number;
      todoId: number;
    }) => {
      try {
        const resp = await AxiosInstance.delete(
          `/todos/${eventId}/${todoId}`,
        );
        return resp.data;
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
      queryClient.invalidateQueries({ queryKey: ["todos-list"] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      todoId,
      payload,
    }: {
      eventId: number;
      todoId: number;
      payload: TodoFormValues;
    }) => {
      try {
        const resp = await AxiosInstance.put(
          `/todos/${eventId}/${todoId}`,
          payload,
        );
        return resp.data;
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
      queryClient.invalidateQueries({ queryKey: ["todos-list"] });
    },
  });
};

export const useToggleTodoComplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      todoId,
      complete,
    }: {
      eventId: number;
      todoId: number;
      complete: boolean;
    }) => {
      try {
        const resp = await AxiosInstance.patch(
          `/todos/${eventId}/${todoId}/complete`,
          { complete },
        );
        return resp.data;
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
      queryClient.invalidateQueries({ queryKey: ["todos-list"] });
    },
  });
};

export const useSendConfirmInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        subject: string;
        body: string;
        company_name_id?: number;
        email?: string;
      };
    }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/send-invoice?id=${id}`,
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Failed to send invoice");
        } else {
          toast.error("Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["confirm-event", id] });
      toast.success("Invoice sent successfully");
    },
  });
};

export const useRefundConfirmEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { refund_amount: number };
    }) => {
      try {
        const response = await AxiosInstance.post(
          `/confirm-event/refund?id=${id}`,
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Failed to process refund");
        } else {
          toast.error("Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["confirm-event", id] });
      toast.success("Refund processed successfully");
    },
  });
};
