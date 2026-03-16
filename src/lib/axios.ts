import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { deleteCookie, getCookie } from "cookies-next";

const AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    "x-mf-instance": "admin-panel",
    Accept: "application/json, text/plain, */*",
  },
});

const onRequest = (config: InternalAxiosRequestConfig) => {
  const token = getCookie("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const onRequestError = (error: AxiosError) => {
  console.log("API Request Error:", error);
  return Promise.reject(error);
};

const onResponse = (response: AxiosResponse) => {
  return response;
};

const onResponseError = (error: AxiosError) => {
  const statusCode = error?.response?.status;

  if (statusCode === 401) {
    console.log("Unauthorized access - performing logout");

    deleteCookie("token");

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
};

AxiosInstance.interceptors.request.use(onRequest, onRequestError);
AxiosInstance.interceptors.response.use(onResponse, onResponseError);

export default AxiosInstance;
