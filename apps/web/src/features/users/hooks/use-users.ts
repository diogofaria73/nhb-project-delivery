import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/user.service';
import { useDebounce } from '@/hooks/use-debounce';
import type { User, UserRole, PaginatedResponse } from '@/types';

interface Filters {
  role?: UserRole;
  isActive?: boolean;
  search: string;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  total: number;
  refetch: () => void;
}

export function useUsers(): UseUsersReturn {
  const [data, setData] = useState<PaginatedResponse<User>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ search: '' });

  const debouncedSearch = useDebounce(filters.search);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.listUsers({
        page,
        limit: 20,
        role: filters.role,
        isActive: filters.isActive,
        search: debouncedSearch || undefined,
      });
      setData(result);
    } catch {
      // Error handled silently — toast from action hooks
    } finally {
      setLoading(false);
    }
  }, [page, filters.role, filters.isActive, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.role, filters.isActive, debouncedSearch]);

  return {
    users: data.data,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages: data.totalPages,
    total: data.total,
    refetch: fetchUsers,
  };
}
