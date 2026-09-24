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
    async (isManualRefresh = false, isSilent = false) => {
      if (!runnerId) return;
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else if (!isSilent) {
          setIsLoading(true);
        }
        setError(null);
        const data = await getAvailableTasks(runnerId);
        setTasks(data);
      } catch (err: any) {
        if (!isSilent) {
          setError(err.message || 'Failed to fetch available tasks');
        }
      } finally {
        if (!isSilent) setIsLoading(false);
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [runnerId]
  );

  useEffect(() => {
    if (!runnerId) return;

    fetchTasks(false, false);

    const client = createWebSocketClient(
      '/ws/available-tasks',
      (message: WebSocketMessage) => {
        if (message.type === 'new_task_available' && message.task) {
          const newTask = message.task;
          setTasks((prevTasks) => {
            const exists = prevTasks.some((t) => t.id === newTask.id);
            if (exists) {
              return prevTasks.map((t) => (t.id === newTask.id ? newTask : t));
            }
            return [newTask, ...prevTasks];
          });
        } else if (message.type === 'task_removed' && message.task_id) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== message.task_id));
        } else if (message.type === 'task_update' && message.task) {
          if (message.task.status !== 'FUNDED') {
            setTasks((prevTasks) => prevTasks.filter((t) => t.id !== message.task!.id));
          } else {
            const updated = message.task;
            setTasks((prevTasks) => prevTasks.map((t) => (t.id === updated.id ? updated : t)));
          }
        }
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    // Periodic heartbeat poll (every 4 seconds) to guarantee feed accuracy
    const pollInterval = setInterval(() => {
      fetchTasks(false, true);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      client.close();
    };
  }, [runnerId, fetchTasks]);

  const refresh = useCallback(() => {
    fetchTasks(true, false);
  }, [fetchTasks]);

  return {
    tasks,
    setTasks,
    isConnected,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
