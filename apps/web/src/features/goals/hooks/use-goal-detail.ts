import { useCallback, useEffect, useState } from 'react';
import { goalService } from '@/services/goal.service';
import type { GoalBreakdownResponse, GoalResponse } from '@/types';

export function useGoalDetail(id: string | undefined, project: boolean) {
  const [goal, setGoal] = useState<GoalResponse | null>(null);
  const [breakdown, setBreakdown] = useState<GoalBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [g, b] = await Promise.all([
        goalService.getGoal(id),
        goalService.getBreakdown(id, project),
      ]);
      setGoal(g);
      setBreakdown(b);
    } catch {
      setGoal(null);
      setBreakdown(null);
    } finally {
      setLoading(false);
    }
  }, [id, project]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { goal, breakdown, loading, refetch: fetch };
}
