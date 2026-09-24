import json
import asyncio
from typing import Dict, Set
from uuid import UUID
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections for real-time task status updates.
    
    Clients connect to /ws/tasks/{task_id} to receive live updates
    when the task status, payment status, or runner assignment changes.
    """

    def __init__(self):
        # task_id -> set of connected WebSocket clients
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, task_id: str, websocket: WebSocket):
        """Accept a WebSocket connection and register it for a specific task."""
        await websocket.accept()
        if task_id not in self._connections:
            self._connections[task_id] = set()
        self._connections[task_id].add(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket):
        """Remove a WebSocket connection from the task's subscriber list."""
        if task_id in self._connections:
            self._connections[task_id].discard(websocket)
            if not self._connections[task_id]:
                del self._connections[task_id]

    async def broadcast_task_update(self, task_id: str, task_data: dict):
        """
        Broadcast a task update to all connected clients watching this task.
        Called whenever a task's status, payment_status, or runner changes.
        """
        if task_id not in self._connections:
            return

        message = json.dumps({
            "type": "task_update",
            "task": task_data,
        })

        dead_connections = set()
        for websocket in self._connections[task_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                dead_connections.add(websocket)

        # Clean up dead connections
        for ws in dead_connections:
            self._connections[task_id].discard(ws)

    async def broadcast_new_task_available(self, task_data: dict):
        """
        Broadcast to a special 'available-tasks' channel when a new task
        becomes FUNDED (visible in runner feeds).
        """
        channel = "available-tasks"
        if channel not in self._connections:
            return

        message = json.dumps({
            "type": "new_task_available",
            "task": task_data,
        })

        dead_connections = set()
        for websocket in self._connections[channel]:
            try:
                await websocket.send_text(message)
            except Exception:
                dead_connections.add(websocket)

        for ws in dead_connections:
            self._connections[channel].discard(ws)

    def get_active_connections_count(self) -> int:
        """Returns total number of active WebSocket connections across all tasks."""
        return sum(len(conns) for conns in self._connections.values())


# Singleton instance used across the application
manager = ConnectionManager()
