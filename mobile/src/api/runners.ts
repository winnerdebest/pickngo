import { apiClient } from './client';
import { Runner, RunnerCreate, Task } from './types';

/**
 * Runner API Endpoints
 */

export async function createRunner(data: RunnerCreate): Promise<Runner> {
  const response = await apiClient.post<Runner>('/runners/', data);
  return response.data;
}

export async function getRunner(runnerId: string): Promise<Runner> {
  const response = await apiClient.get<Runner>(`/runners/${runnerId}`);
  return response.data;
}

export async function getRunners(skip = 0, limit = 50): Promise<Runner[]> {
  const response = await apiClient.get<Runner[]>('/runners/', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getAvailableTasks(runnerId: string): Promise<Task[]> {
  const response = await apiClient.get<Task[]>(`/runners/${runnerId}/available-tasks`);
  return response.data;
}

export async function getRunnerTasks(runnerId: string): Promise<Task[]> {
  const response = await apiClient.get<Task[]>(`/runners/${runnerId}/tasks`);
  return response.data;
}
