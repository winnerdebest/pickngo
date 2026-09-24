import { apiClient } from './client';
import {
  Task,
  TaskCreatePayload,
  TaskFundPayload,
  TaskAcceptPayload,
  TaskStatusUpdatePayload,
  TaskRatePayload,
  TaskDisputePayload,
  TaskCancelPayload,
} from './types';

/**
 * Task API Endpoints
 */

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  const response = await apiClient.post<Task>('/tasks/', payload);
  return response.data;
}

export async function getTasks(skip = 0, limit = 50): Promise<Task[]> {
  const response = await apiClient.get<Task[]>('/tasks/', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getTask(taskId: string): Promise<Task> {
  const response = await apiClient.get<Task>(`/tasks/${taskId}`);
  return response.data;
}

export async function fundTask(taskId: string, payload: TaskFundPayload = {}): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/fund`, payload);
  return response.data;
}

export async function acceptTask(taskId: string, payload: TaskAcceptPayload): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/accept`, payload);
  return response.data;
}

export async function updateTaskStatus(
  taskId: string,
  payload: TaskStatusUpdatePayload
): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/status`, payload);
  return response.data;
}

export async function confirmDelivery(taskId: string): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/confirm-delivery`);
  return response.data;
}

export async function rateRunner(taskId: string, payload: TaskRatePayload): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/rate`, payload);
  return response.data;
}

export async function disputeTask(taskId: string, payload: TaskDisputePayload): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/dispute`, payload);
  return response.data;
}

export async function cancelTask(taskId: string, payload: TaskCancelPayload = {}): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/cancel`, payload);
  return response.data;
}
