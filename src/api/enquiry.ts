import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface PackageParams {
  event_date: string;
  staff: number | null;
  package_name: string;
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
