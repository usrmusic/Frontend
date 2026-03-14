import { useMutation, useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import { notification } from "antd";
import axios from "axios";

type QueryParams = {
  page: number;
  perPage: number;
  search: string;
};

type Meta = {
  total: number;
  perPage: number;
  page: number;
  totalPages: number;
};

type ApiResponse<T> = {
  data: T[];
  meta: Meta;
};

type Venue = {
  id: number;
  venue: string;
  address: string;
  stage: string;
  power: string;
  access: string;
  smokeNote: string;
  riggingPoint: string;
  notes: string;
};

type Client = {
  id: number;
  name: string;
  email: string;
  password: string;
  contact_number: string;
  address: string;
};

type Suppliers = {
  id: number;
  name: string;
  company_name: string;
  email: string;
  contact_number: string;
  industry: string;
  notes: string;
};

type Packages = {
  id: number;
  user_id: number;
  package_name: string;
  cost_price: number;
  sell_price: number;
  users: {
    name: string;
    email: string;
  };
};

export type Company = {
  id: string;
  name: string;
  company_logo: string;
  brochure: string;
  contact_name: string;
  telephone_number: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  address_name: string;
  street: string;
  city: string;
  postal_code: string;
  bank_name: string;
  sort_code: string;
  account_number: string;
  vat: string | null;
  vat_percentage: number | null;
  admin_signature: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type User = {
  id: number;
  role_id: string;
  name: string;
  email: string;
  password: string;
  profile_photo: string;
  password_text: string;
  contact_number: string;
  address: string;
  is_email_send: boolean;
  sidebar_active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
};

export type Role = {
  id: string;
  name: string;
  guard_name: string;
  created_at: string | null;
  updated_at: string | null;
};

export type EmailContent = {
  id: string;
  email_name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ManageAccessResponse = {
  roles: Role[];
};

type ClientPayload = {
  role_id: string;
  name: string;
  email: string;
  event_date: string;
  contact_number: string;
};
export const useClients = (params: QueryParams) => {
  return useQuery<ApiResponse<Client>>({
    queryKey: ["users", params],
    queryFn: async (): Promise<ApiResponse<Client>> => {
      try {
        const response = await AxiosInstance.get("/client", { params });
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
    enabled: !!params,
  });
};

export const useVenues = (params: QueryParams) => {
  return useQuery<ApiResponse<Venue>>({
    queryKey: ["venues", params],
    queryFn: async (): Promise<ApiResponse<Venue>> => {
      const response = await AxiosInstance.get<ApiResponse<Venue>>("/venue", {
        params,
      });
      return response.data;
    },
    enabled: !!params,
  });
};
export const useSuppliers = (params: QueryParams) => {
  return useQuery<ApiResponse<Suppliers>>({
    queryKey: ["suppliers", params],
    queryFn: async (): Promise<ApiResponse<Suppliers>> => {
      const response = await AxiosInstance.get<ApiResponse<Suppliers>>(
        "/supplier",
        {
          params,
        },
      );
      return response.data;
    },
    enabled: !!params,
  });
};
export const usePackages = (params: QueryParams) => {
  return useQuery<ApiResponse<Packages>>({
    queryKey: ["packages", params],
    queryFn: async (): Promise<ApiResponse<Packages>> => {
      const response = await AxiosInstance.get<ApiResponse<Packages>>(
        "/package",
        {
          params,
        },
      );
      return response.data;
    },
    enabled: !!params,
  });
};
export const useCompanies = (params: QueryParams) => {
  return useQuery<ApiResponse<Company>>({
    queryKey: ["companies", params],
    queryFn: async (): Promise<ApiResponse<Company>> => {
      const response = await AxiosInstance.get<ApiResponse<Company>>(
        "/company",
        {
          params,
        },
      );
      return response.data;
    },
    enabled: !!params,
  });
};
export const useUsers = (params: QueryParams) => {
  return useQuery<ApiResponse<User>>({
    queryKey: ["users", params],
    queryFn: async (): Promise<ApiResponse<User>> => {
      const response = await AxiosInstance.get<ApiResponse<User>>("/user", {
        params,
      });
      return response.data;
    },
    enabled: !!params,
  });
};
export const useEmail = (params: QueryParams) => {
  return useQuery<ApiResponse<EmailContent>>({
    queryKey: ["email-content", params],
    queryFn: async (): Promise<ApiResponse<EmailContent>> => {
      const response = await AxiosInstance.get<ApiResponse<EmailContent>>(
        "/email-content",
        {
          params,
        },
      );
      return response.data;
    },
    enabled: !!params,
  });
};
export const useManageAccess = () => {
  return useQuery<ManageAccessResponse>({
    queryKey: ["manage-access"],
    queryFn: async (): Promise<ManageAccessResponse> => {
      const response = await AxiosInstance.get<ManageAccessResponse>(
        "/roles-permissions/manage-access",
      );
      return response.data;
    },
  });
};

export const useAddClient = () => {
  return useMutation({
    mutationFn: async (payload: ClientPayload) => {
      const response = await AxiosInstance.post("/client", payload);
      return response.data;
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });
};
export const useEditClient = () => {
  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: ClientPayload & { id: number | string }) => {
      const { id, ...rest } = payload;
      const response = await AxiosInstance.put(`/client/${id}`, rest);
      return response.data;
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });
};
