import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "../lib/axios";

interface Role {
  id: string;
  name: string;
}

interface UserDropdown {
  id: number;
  name: string;
  package_users: { id: string; package_name: string }[];
}

export const useRoleDropdown = () => {
  return useQuery({
    queryKey: ["role-dropdown"],
    queryFn: async (): Promise<Role[]> => {
      const response = await AxiosInstance.get("/user/roles");
      return response.data;
    },
  });
};
export const useClientDropdown = () => {
  return useQuery({
    queryKey: ["client-dropdown"],
    queryFn: async (): Promise<{ id: number; name: string }[]> => {
      const response = await AxiosInstance.get("/client/get-dropdown");
      return response.data;
    },
  });
};
export const useVenueDropdown = () => {
  return useQuery({
    queryKey: ["venue-dropdown"],
    queryFn: async (): Promise<{ id: number; venue: string }[]> => {
      const response = await AxiosInstance.get("/venue/get-dropdown");
      return response.data;
    },
  });
};
export const useUsersDropdown = () => {
  return useQuery({
    queryKey: ["user-dropdown"],
    queryFn: async (): Promise<UserDropdown[]> => {
      const response = await AxiosInstance.get("/user/get-dropdown");
      return response.data;
    },
  });
};
// Enquiry form's "Select DJ" — only accounts with an actual configured
// package, not every staff/admin account (see /user/dj-dropdown on the
// backend). Separate from useUsersDropdown above, which the Packages page's
// "Add Package" modal needs unfiltered (must be able to pick a DJ who has
// no package yet, since assigning their first one is the point of that
// screen).
export const useDjDropdown = () => {
  return useQuery({
    queryKey: ["dj-dropdown"],
    queryFn: async (): Promise<UserDropdown[]> => {
      const response = await AxiosInstance.get("/user/dj-dropdown");
      return response.data;
    },
  });
};
export const useCompanyDropdown = () => {
  return useQuery({
    queryKey: ["company-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/company/get-dropdown");
      return response.data;
    },
  });
};
export const useRigListEventsDropdown = (showAll: boolean = false) => {
  return useQuery({
    queryKey: ["events-dropdown", showAll],
    queryFn: async () => {
      const response = await AxiosInstance.get("/rig-list/drop-down", {
        params: showAll ? { show_all: true } : undefined,
      });
      return response.data;
    },
  });
};
// Separate from useRigListEventsDropdown above — that one hits /rig-list/drop-down,
// which requires the "rig list" permission and is hard-blocked for Client (Rig
// List is genuinely never a Client feature). The confirmed-events page's own
// event picker isn't a rig-list concern, so it gets its own properly-scoped
// endpoint instead of borrowing rig-list's.
export const useConfirmEventsDropdown = (
  includeCancelled: boolean = false,
  includeCompleted: boolean = false,
) => {
  return useQuery({
    queryKey: ["confirm-events-dropdown", includeCancelled, includeCompleted],
    queryFn: async () => {
      const params: Record<string, boolean> = {};
      if (includeCancelled) params.include_cancelled = true;
      if (includeCompleted) params.include_completed = true;
      const response = await AxiosInstance.get("/confirm-event/events-dropdown", {
        params: Object.keys(params).length ? params : undefined,
      });
      return response.data;
    },
  });
};
export const useEquipmentDropdown = () => {
  return useQuery({
    queryKey: ["equipment-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/equipment/get-dropdown");
      return response.data;
    },
  });
};
export const useSupplierDropdown = () => {
  return useQuery({
    queryKey: ["supplier-dropdown"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/supplier/get-dropdown");
      return response.data;
    },
  });
};
