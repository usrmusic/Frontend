import { useMutation, useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { toast } from "react-toastify";

export const useGetRigList = (id: string) => {
  return useQuery({
    queryKey: ["riglist", id],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/rig-list/${id}`);
      return response.data;
    },
  });
};

export const useSaveRigNotes = () => {
  return useMutation({
    mutationFn: async (payload: { note: string } & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.post(`/rig-list/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onError: (error) => {
      console.error("add supplier failed:", error.message);
    },
  });
};
