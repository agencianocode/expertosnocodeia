import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user,
    retry: false,
  });

  const { data: adminUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user,
    retry: false,
  });

  const isAdmin = !!adminStats;
  const isLoading = authLoading || statsLoading;

  return {
    user,
    adminStats,
    adminUsers,
    isAdmin,
    isLoading: isLoading,
    isUsersLoading: usersLoading,
  };
}