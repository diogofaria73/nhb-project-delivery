import { apiClient } from './api-client';
import type {
  GoalResponse,
  GoalBreakdownResponse,
  GoalCreatePayload,
  GoalUpdatePayload,
  ListGoalsParams,
} from '@/types';

export const goalService = {
  listGoals(params: ListGoalsParams = {}): Promise<GoalResponse[]> {
    return apiClient.get<GoalResponse[]>('/goals', params as Record<string, unknown>);
  },

  getGoal(id: string): Promise<GoalResponse> {
    return apiClient.get<GoalResponse>(`/goals/${id}`);
  },

  getBreakdown(id: string, project = false): Promise<GoalBreakdownResponse> {
    return apiClient.get<GoalBreakdownResponse>(`/goals/${id}/breakdown`, {
      project: project ? 'true' : 'false',
    });
  },

  createGoal(payload: GoalCreatePayload): Promise<GoalResponse> {
    return apiClient.post<GoalResponse>('/goals', payload);
  },

  updateGoal(id: string, payload: GoalUpdatePayload): Promise<GoalResponse> {
    return apiClient.put<GoalResponse>(`/goals/${id}`, payload);
  },

  archiveGoal(id: string): Promise<GoalResponse> {
    return apiClient.post<GoalResponse>(`/goals/${id}/archive`, {});
  },

  deleteGoal(id: string): Promise<void> {
    return apiClient.delete(`/goals/${id}`);
  },

  exportBreakdown(id: string, project = false): Promise<Blob> {
    return apiClient.getBlob(`/goals/${id}/export`, {
      project: project ? 'true' : 'false',
    });
  },
};
