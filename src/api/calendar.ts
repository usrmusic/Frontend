import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

export const useCalendar = () => {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/calendar`);
      return response.data;
    },
  });
};
