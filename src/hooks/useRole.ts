"use client";

import { useAuth } from "./useAuth";

// Centralised role detection for the app. Mirrors the backend admin guard:
// admin = manage_all/super_admin permission OR role_id 1 (super) / 2 (admin).
// Client = role_id 4. Anything else falls through to "other".
export function useRole() {
  const { data } = useAuth();
  const perms = data?.permissions ?? [];
  const roleId = Number(data?.role_id ?? 0);
  const isSuper = perms.includes("manage_all") || perms.includes("super_admin");
  const isAdmin = isSuper || roleId === 1 || roleId === 2;
  const isClient = roleId === 4;
  return { isAdmin, isClient, userId: data?.id, roleId };
}

export default useRole;
