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
  name: string;
  email: string;
  password: string;
  contact_number: string;
  address: string;
};

type ApiResponse<T> = {
  data: T[];
  meta: Meta;
};

type ClientsParams = Pick<QueryParams, "page" | "perPage" | "name">;
type VenuesParams = Pick<QueryParams, "page" | "perPage" | "search">;

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
