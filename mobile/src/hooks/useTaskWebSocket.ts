import { useEffect, useState, useCallback, useRef } from 'react';
import { Task, WebSocketMessage } from '../api/types';
import { getTask } from '../api/tasks';
import { createWebSocketClient } from '../utils/websocket';

interface UseTaskWebSocketOptions {
  taskId?: string;
  initialTask?: Task | null;
  onStatusChange?: (status: string) => void;
}

/**
 * Hook to manage real-time WebSocket updates for a specific task.
 * Automatically handles connection, updates, and fallback polling on error.
 */
export function useTaskWebSocket({ taskId, initialTask, onStatusChange }: UseTaskWebSocketOptions) {
  const [task, setTask] = useState<Task | null>(initialTask || null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!initialTask && !!taskId);
  const [error, setError] = useState<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Sync initialTask if provided
  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
    }
  }, [initialTask]);

  // REST fallback fetch
  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTask(taskId);
      setTask(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    // Initial fetch if we don't have the task
    if (!task) {
      fetchTask();
    }

    const client = createWebSocketClient(
      `/ws/tasks/${taskId}`,
      (message: WebSocketMessage) => {
        if (message.type === 'task_update' && message.task) {
          setTask(message.task);
          if (onStatusChangeRef.current) {
            onStatusChangeRef.current(message.task.status);
          }
        }
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      client.close();
    };
  }, [taskId, fetchTask]);

  return {
    task,
    setTask,
    isConnected,
    isLoading,
    error,
    refetch: fetchTask,
  };
}
