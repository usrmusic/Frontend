import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

type QueryParams = {
  page: number;
  perPage: number;
  name: string;
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

type ClientsParams = Pick<QueryParams, "page" | "perPage" | "name">;
type VenuesParams = Pick<QueryParams, "page" | "perPage" | "search">;
type SuppliersParams = Pick<QueryParams, "page" | "perPage" | "search">;
type PackagesParams = Pick<QueryParams, "page" | "perPage" | "search">;

export const useClients = (params: ClientsParams) => {
  return useQuery<ApiResponse<Client>>({
    queryKey: ["users", params],
    queryFn: async (): Promise<ApiResponse<Client>> => {
      const response = await AxiosInstance.get("/client", { params });
      return response.data;
    },
    enabled: !!params,
  });
};

export const useVenues = (params: VenuesParams) => {
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
export const useSuppliers = (params: SuppliersParams) => {
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
export const usePackages = (params: PackagesParams) => {
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
