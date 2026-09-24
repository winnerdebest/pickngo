import { useEffect, useState, useCallback, useRef } from 'react';
import { Task, WebSocketMessage } from '../api/types';
import { getAvailableTasks } from '../api/runners';
import { createWebSocketClient } from '../utils/websocket';

interface UseAvailableTasksOptions {
  runnerId?: string;
}

/**
 * Hook to manage real-time available tasks feed for runners.
 * Listens on /ws/available-tasks for newly funded tasks.
 */
export function useAvailableTasksWebSocket({ runnerId }: UseAvailableTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (isManualRefresh = false) => {
      if (!runnerId) return;
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        const data = await getAvailableTasks(runnerId);
        setTasks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch available tasks');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [runnerId]
  );

  useEffect(() => {
    if (!runnerId) return;

    fetchTasks();

    const client = createWebSocketClient(
      '/ws/available-tasks',
      (message: WebSocketMessage) => {
        if (message.type === 'new_task_available' && message.task) {
          const newTask = message.task;
          setTasks((prevTasks) => {
            // Check if already in list
            const exists = prevTasks.some((t) => t.id === newTask.id);
            if (exists) {
              return prevTasks.map((t) => (t.id === newTask.id ? newTask : t));
            }
            return [newTask, ...prevTasks];
          });
        }
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      client.close();
    };
  }, [runnerId, fetchTasks]);

  return {
    tasks,
    setTasks,
    isConnected,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchTasks(true),
  };
}
