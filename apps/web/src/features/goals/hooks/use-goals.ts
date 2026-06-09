import { useCallback, useEffect, useState } from 'react';
import { goalService } from '@/services/goal.service';
import type { GoalListStatusFilter, GoalResponse } from '@/types';

export function useGoals(status?: GoalListStatusFilter) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await goalService.listGoals(status ? { status } : {});
      setGoals(result);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { goals, loading, refetch: fetch };
}
