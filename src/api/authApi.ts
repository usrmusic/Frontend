// hooks/useLogin.ts
import { useMutation } from "@tanstack/react-query";
import { setCookie } from "cookies-next";
import AxiosInstance from "../lib/axios";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await AxiosInstance.post<unknown>("/user/auth", payload);
      return response.data as unknown;
    },

    onSuccess: (data: unknown) => {
      // ensure expected properties exist before using them
      if (data && typeof data === "object") {
        const maybe = data as { accessToken?: string; refreshToken?: string };
        if (maybe.accessToken) setCookie("token", maybe.accessToken);
        if (maybe.refreshToken) setCookie("refreshToken", maybe.refreshToken);
      }
    },

    onError: (error: unknown) => {
      console.error("Login failed:", error);
    },
  });
};
