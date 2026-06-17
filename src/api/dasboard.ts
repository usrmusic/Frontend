import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";

type Monthly = {
  labels: string[];
  counts: number[];
  profits: number[];
};

type SalesAnalytics = {
  statusCounts: Record<string, number>;
  djCounts: Record<string, number | string>;
};

type PendingPayment = {
  id: number;
  couple_name: string | null;
  expected: number;
  paid: number;
  outstanding: number;
  date: string | null;
  client_name: string | null;
  event_status_id?: number;
};

type CalendarEvent = {
  id: number;
  date: string;
  couple_name: string | null;
};

type RecentNote = {
  id: number;
  event_id: number;
  notes: string;
  created_at: string;
  created_by: string | null;
};

export type DashboardDropdownItem = {
  id: number;
  status: number;
  couple_name: string | null;
  date?: string | null;
  client: {
    id: number;
    name: string;
  } | null;
};

export interface DashboardResponse {
  year: number;
  totalEvents: number;
  openEnquiriesCount: number;
  confirmedEventsCount: number;
  totalProfit: number;
  monthly: Monthly;
  salesAnalytics: SalesAnalytics;
  pendingPayments: PendingPayment[];
  openEnquiries: any[];
  calendarEvents: CalendarEvent[];
  recentNotes: RecentNote[];
  totalTurnover: number;
  scope?: "admin" | "team" | "personal";
}


export type DashboardQueryParams = {
  year?: number;
};

export const useDashboard = (params: DashboardQueryParams) => {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard", params],
    queryFn: async (): Promise<DashboardResponse> => {
      try {
        const response = await AxiosInstance.get<DashboardResponse>("/dashboard", { params });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          import("antd").then(({ notification }) => {
            notification.error({
              message: "API Error",
              description: msg?.error || msg?.message,
              placement: "topRight",
            });
          });
        }
        throw error;
      }
    },
    enabled: !!params,
  });
};

export type DashboardDropdownParams = {
  search?: string;
};

export const useDashboardDropdown = (params?: DashboardDropdownParams) => {
  return useQuery<DashboardDropdownItem[]>({
    queryKey: ["dashboard-dropdown", params],
    queryFn: async (): Promise<DashboardDropdownItem[]> => {
      try {
        const response = await AxiosInstance.get<DashboardDropdownItem[]>("/dashboard/drop-down", { params });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          import("antd").then(({ notification }) => {
            notification.error({
              message: "API Error",
              description: msg?.error || msg?.message,
              placement: "topRight",
            });
          });
        }
        throw error;
      }
    },
    enabled: !!params,
  });
};

export type UpcomingEventParams = {
  search?: string;
  page?: number;
  perPage?: number;
};

export type UpcomingEvent = {
  id: number;
  date: string;
  venue_name?: string | null;
  couple_name?: string | null;
  dj_name?: string | null;
};

export const useUpcomingEvents = (params?: UpcomingEventParams) => {
  return useQuery<UpcomingEvent[]>({
    queryKey: ["upcoming-events", params],
      queryFn: async (): Promise<UpcomingEvent[]> => {
        try {
          const response = await AxiosInstance.get<any>('/dashboard/upcoming-events', { params });
          // backend may return either an array or an object { scope, events }
          if (Array.isArray(response.data)) return response.data as UpcomingEvent[];
          if (response.data && Array.isArray(response.data.events)) return response.data.events as UpcomingEvent[];
          return [];
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          import('antd').then(({ notification }) => {
            notification.error({ message: 'API Error', description: msg?.error || msg?.message, placement: 'topRight' });
          });
        }
        throw error;
      }
    },
    enabled: !!params,
  });
};