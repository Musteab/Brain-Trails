"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * Hook that derives role-based access flags from the current user's profile.
 *
 * Usage:
 *   const { isAdmin, isDev, isBetaTester } = useAdmin();
 */
export function useAdmin() {
  const { profile } = useAuth();
  const role = profile?.role;

  return {
    isAdmin: role === "admin" || role === "dev",
    isDev: role === "dev",
    isBetaTester: role === "beta_tester",
    role: role ?? "student",
  };
}
