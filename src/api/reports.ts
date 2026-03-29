import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { notification } from "antd";

type QueryParams = {
  page: number;
  perPage: number;
  search?: string;
};
export const useSuppliersReport = (params: QueryParams) => {
  return useQuery({
    queryKey: ["suppliers-report", params],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get(`/reports/suppliers`, {
          params,
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
  return useQuery({
    queryKey: ["admin-report", params],
    queryFn: async () => {
      try {
        const response = await AxiosInstance.get(`/reports/admin`, { params });
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
