import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface QueryParams {
  year: number;
}

export const useCalendar = (params: QueryParams) => {
  return useQuery({
    queryKey: ["calendar", params],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/calendar`, {
        params,
      });
      return response.data;
    },
  });
};
