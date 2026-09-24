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
 * Hook to manage real-time updates for a specific task.
 * Connects via native WebSocket for instant push events,
 * and maintains background heartbeat sync for zero-latency cross-device sync.
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

  // REST fetch / refresh
  const fetchTask = useCallback(async (isSilent = false) => {
    if (!taskId) return;
    try {
      if (!isSilent) setIsLoading(true);
      setError(null);
      const data = await getTask(taskId);
      setTask(data);
    } catch (err: any) {
      if (!isSilent) {
        setError(err.message || 'Failed to fetch task');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    // Initial load
    fetchTask(false);

    // WebSocket real-time subscription
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

    // Periodic heartbeat poll (every 4 seconds) to ensure instant synchronization
    // across physical devices and emulators
    const pollInterval = setInterval(() => {
      fetchTask(true);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      client.close();
    };
  }, [taskId, fetchTask]);

  const refetch = useCallback(() => {
    fetchTask(false);
  }, [fetchTask]);

  return {
    task,
    setTask,
    isConnected,
    isLoading,
    error,
    refetch,
  };
}
