import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";
import axios from "axios";
import { Key } from "react";
import { toast } from "react-toastify";
import { ApiResponse } from "../types/types";

type QueryParams = {
  page: number;
  perPage: number;
  search: string;
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
  password_text: string;
  contact_number: string;
  address: string;
  status?: string;
  eventDate?: string;
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
  permissions: {
    id: string;
    name: string;
    guard_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }[];
};

type ClientPayload = {
  role_id: string;
  name: string;
  email: string;
  event_date: string;
  contact_number: string;
};

type VenuePayload = {
  venue: string;
  venue_address: string;
  stage: string;
  power: string;
  rigging_point: string;
  notes: string;
};

type SupplierPayload = {
  name: string;
  company_name: string;
  email: string;
  contact_number: string;
  industry: string;
  notes: string;
};

type UserPayload = {
  name: string;
  email: string;
  contact_number: string;
  role_id: string;
  sendEmail: boolean;
};

type PackagePayload = {
  user_id: number;
  sell_price: number;
  cost_price: number;
  package_name: string;
};

type CompanyPayload = {
  name: string;
  contact_name: string;
  telephone_number: string;
  email: string;
  website: string;
  address_name: string;
  city: string;
  company_logo: File;
  brochure: File;
  admin_signature: string;
};

export const useClients = (params: QueryParams) => {
  return useQuery<ApiResponse<Client>>({
    queryKey: ["clients", params],
    queryFn: async (): Promise<ApiResponse<Client>> => {
      try {
        const response = await AxiosInstance.get("/client", { params });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;

          toast.error(msg?.error || "API Error");
        } else {
          toast.error("Something went wrong");
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
      try {
        const response = await AxiosInstance.get<ApiResponse<User>>("/user", {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          import("antd").then(({ notification }) => {
            notification.error({
              message: "API Error",
              description: msg?.error,
              placement: "topRight",
            });
          });
        }
        throw error;
      }
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

export const useManageAccess = (enabled = true) => {
  return useQuery<ManageAccessResponse>({
    queryKey: ["manage-access"],
    queryFn: async (): Promise<ManageAccessResponse> => {
      const response = await AxiosInstance.get<ManageAccessResponse>(
        "/roles-permissions/manage-access",
      );
      return response.data;
    },
    enabled,
  });
};

export const useAddClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientPayload) => {
      try {
        const response = await AxiosInstance.post("/client", payload);
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
      console.error("add client failed:", error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
export const useAddVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VenuePayload) => {
      try {
        const response = await AxiosInstance.post("/venue", payload);
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
      console.error("add venue failed:", error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
};
export const useAddSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SupplierPayload) => {
      try {
        const response = await AxiosInstance.post("/supplier", payload);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useEditClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: ClientPayload & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/client/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      console.error("edit client failed:", error.message);
    },
  });
};
export const useEditVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: VenuePayload & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/venue/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      console.error("edit venue failed:", error.message);
    },
  });
};
export const useEditSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: SupplierPayload & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/supplier/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      console.error("edit supplier failed:", error.message);
    },
  });
};
export const useEditUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: UserPayload & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/user/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("edit user failed:", error.message);
    },
  });
};
export const useEditPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect payload to contain an id property along with other client properties
    mutationFn: async (payload: PackagePayload & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/package/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => {
      console.error("edit package failed:", error.message);
    },
  });
};
export const useAddRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; guard_name: string }) => {
      const response = await AxiosInstance.post(
        "/roles-permissions/roles",
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-access"] });
    },
    onError: (error) => {
      console.error("add role failed:", error.message);
    },
  });
};
export const useAddCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FormData) => {
      try {
        // Send FormData as the request body with the correct Content-Type
        const response = await AxiosInstance.post("/company", payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("add company failed:", error.message);
    },
  });
};
export const useEditCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Accept both id and formData as params
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | string;
      payload: FormData;
    }) => {
      try {
        // PATCH is more typical for updates, but POST will be preserved if your backend requires it
        const response = await AxiosInstance.post(`/company/${id}`, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("edit company failed:", error.message);
    },
  });
};
export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UserPayload) => {
      try {
        const response = await AxiosInstance.post("/user", payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("add user failed:", error.message);
    },
  });
};
export const useAddPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PackagePayload) => {
      try {
        const response = await AxiosInstance.post("/package", payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => {
      console.error("add package failed:", error.message);
    },
  });
};
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post(
          "/client/delete-many",
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
export const useDeleteVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post(
          "/venue/delete-many",
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post(
          "/supplier/delete-many",
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
export const useDeletePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post(
          "/package/delete-many",
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post("/user/delete-many", payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        const response = await AxiosInstance.post(
          "/company/delete-many",
          payload,
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("delete failed:", error.message);
    },
  });
};
 
// Equipment APIs
export type Equipment = {
  id: number;
  supplier_id?: number | null;
  name: string;
  cost_price?: number | null;
  sell_price?: number | null;
  status?: string;
  quantity?: number | null;
  pricing_guide?: string | null;
  rig_notes?: string | null;
};

export const useEquipment = (params: QueryParams) => {
  return useQuery<ApiResponse<Equipment>>({
    queryKey: ["equipment", params],
    queryFn: async (): Promise<ApiResponse<Equipment>> => {
      const response = await AxiosInstance.get<ApiResponse<Equipment>>(
        "/equipment",
        { params },
      );
      return response.data;
    },
    enabled: !!params,
  });
};

export const useGetEquipment = (id?: number | string) => {
  return useQuery({
    queryKey: ["equipment", "get", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await AxiosInstance.get(`/equipment/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useAddEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Equipment>) => {
      try {
        const response = await AxiosInstance.post("/equipment", payload);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      // In case adding equipment created a new supplier via supplier_name, refresh supplier dropdown/cache
      queryClient.invalidateQueries({ queryKey: ["supplier-dropdown"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useEditEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Equipment> & { id: number | string }) => {
      try {
        const { id, ...rest } = payload;
        const response = await AxiosInstance.put(`/equipment/${id}`, rest);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      // Ensure supplier lists are refreshed if update created a supplier
      queryClient.invalidateQueries({ queryKey: ["supplier-dropdown"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ids: Key[]; force: boolean }) => {
      try {
        // Backend equipment delete-many expects ids in the URL params (route: DELETE /equipment/delete-many/:ids)
        const ids = Array.isArray(payload.ids) ? payload.ids.map(String).join(",") : String(payload.ids);
        const response = await AxiosInstance.delete(
          `/equipment/delete-many/${ids}`,
          { data: { force: !!payload.force } },
        );
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data;
          toast.error(msg?.error || "Something went wrong");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
};
