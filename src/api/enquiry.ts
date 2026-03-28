import { useQuery } from "@tanstack/react-query";
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
