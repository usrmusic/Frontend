import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import AxiosInstance from "../lib/axios";

export type ContractEvent = {
  id: number | string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  contract_token?: string | null;
  contract_signed_at?: string | null;
  total_cost_for_equipment?: string | number | null;
  deposit_amount?: string | number | null;
  invoice?: number | null;
  users_events_user_idTousers?: {
    id?: number | string;
    name?: string;
    email?: string;
    contact_number?: string | null;
  } | null;
  venues?: { venue?: string | null; venue_address?: string | null } | null;
};

export type ContractCompany = {
  id?: number | string;
  name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  telephone_number?: string | null;
  address_name?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  admin_signature_url?: string | null;
};

export type ContractView = {
  event: ContractEvent;
  company: ContractCompany | null;
  already_signed: boolean;
  signed_pdf_url: string | null;
};

// Public axios instance (no auth interceptor) for the unauthenticated signing
// page. Avoids the global 401 -> /login redirect that the authenticated
// AxiosInstance applies.
const PublicAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export function useContractByToken(token: string | null | undefined) {
  return useQuery<ContractView>({
    queryKey: ["contract-token", token],
    queryFn: async () => {
      if (!token) throw new Error("missing_token");
      const resp = await PublicAxios.get<{ success: boolean; data: ContractView }>(
        `/contract/${encodeURIComponent(token)}`,
      );
      return resp.data.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useSignContract(token: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (signature_image: string) => {
      if (!token) throw new Error("missing_token");
      const resp = await PublicAxios.post<{
        success: boolean;
        data: {
          contract_id: string | number;
          event_id: string | number;
          signed_pdf_url: string | null;
          signed_at: string;
        };
      }>(`/contract/${encodeURIComponent(token)}/sign`, { signature_image });
      return resp.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-token", token] });
    },
  });
}

// Authenticated helpers used from the admin/confirmed-events screen.
export function useEnsureContractToken() {
  return useMutation({
    mutationFn: async (eventId: number | string) => {
      const resp = await AxiosInstance.post<{
        success: boolean;
        data: {
          event_id: number;
          contract_token: string;
          signing_url: string | null;
          already_signed: boolean;
        };
      }>(`/contract/event/${eventId}/token`);
      return resp.data.data;
    },
  });
}

export function useSendContractEmail() {
  return useMutation({
    mutationFn: async (eventId: number | string) => {
      const resp = await AxiosInstance.post<{
        success: boolean;
        data: { event_id: number; signing_url: string | null };
      }>(`/contract/event/${eventId}/send`);
      return resp.data.data;
    },
  });
}

export type ContractRow = {
  id: number | string;
  event_id: number;
  user_id: number;
  signed_pdf_path: string | null;
  signed_at: string | null;
  status: string;
  amount: number | null;
  filename: string | null;
  view_url: string | null;
  download_url: string | null;
  signatures?: Array<{
    id: number | string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string | null;
  }>;
};

export function useEventContracts(eventId: number | string | null | undefined) {
  return useQuery<ContractRow[]>({
    queryKey: ["event-contracts", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const resp = await AxiosInstance.get<{ success: boolean; data: ContractRow[] }>(
        `/contract/event/${eventId}/list`,
      );
      return resp.data.data || [];
    },
    enabled: !!eventId,
  });
}

export function useDeleteContract(eventId?: number | string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const resp = await AxiosInstance.delete<{ success: boolean }>(
        `/contract/admin/${id}`,
      );
      return resp.data;
    },
    onSuccess: () => {
      // Refresh the table, plus the parent confirmed-event row so the
      // "signed" badge updates if the deleted row was the latest.
      queryClient.invalidateQueries({ queryKey: ["event-contracts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["confirm-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["confirm-events"] });
    },
  });
}
