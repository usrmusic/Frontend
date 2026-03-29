// hooks/useLogin.ts
import { useMutation } from "@tanstack/react-query";
import { setCookie } from "cookies-next";
import AxiosInstance from "../lib/axios";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await AxiosInstance.post("/user/auth", payload);

      return response.data;
    },

    onSuccess: (data) => {
      setCookie("token", data.accessToken);
      setCookie("refreshToken", data.refreshToken);
    },

    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });
};
