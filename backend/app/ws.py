import json
import asyncio
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket

logger = logging.getLogger("pickngo.ws")


class ConnectionManager:
    """
    Manages WebSocket connections for real-time task status updates.
    
    Clients connect to:
      - /ws/tasks/{task_id} to receive live task state transitions
      - /ws/available-tasks to receive new funded errand broadcasts
    """

    def __init__(self):
        # task_id -> set of connected WebSocket clients
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """Register the main application event loop for cross-thread broadcasts."""
        self._loop = loop

    async def connect(self, channel_or_task_id: str, websocket: WebSocket):
        """Accept a WebSocket connection and register it."""
        await websocket.accept()
        if self._loop is None:
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                pass

        if channel_or_task_id not in self._connections:
            self._connections[channel_or_task_id] = set()
        self._connections[channel_or_task_id].add(websocket)
        logger.info(f"[WS] Client connected to '{channel_or_task_id}'. Active on channel: {len(self._connections[channel_or_task_id])}")

    def disconnect(self, channel_or_task_id: str, websocket: WebSocket):
        """Remove a WebSocket connection from the subscriber list."""
        if channel_or_task_id in self._connections:
            self._connections[channel_or_task_id].discard(websocket)
            if not self._connections[channel_or_task_id]:
                del self._connections[channel_or_task_id]
        logger.info(f"[WS] Client disconnected from '{channel_or_task_id}'")

    async def broadcast_task_update(self, task_id: str, task_data: dict):
        """
        Async broadcast to all connected clients watching this specific task.
        """
        if task_id not in self._connections:
            return

        message = json.dumps({
            "type": "task_update",
            "task": task_data,
        })

        dead_connections = set()
        for websocket in list(self._connections[task_id]):
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.warning(f"[WS] Failed sending to client on task {task_id}: {e}")
                dead_connections.add(websocket)

        for ws in dead_connections:
            self._connections[task_id].discard(ws)

    async def broadcast_new_task_available(self, task_data: dict):
        """
        Async broadcast to 'available-tasks' channel when a task is FUNDED.
        """
        channel = "available-tasks"
        if channel not in self._connections:
            return

        message = json.dumps({
            "type": "new_task_available",
            "task": task_data,
        })

        dead_connections = set()
        for websocket in list(self._connections[channel]):
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.warning(f"[WS] Failed sending new available task: {e}")
                dead_connections.add(websocket)

        for ws in dead_connections:
            self._connections[channel].discard(ws)

    async def broadcast_task_removed(self, task_id: str):
        """
        Async broadcast to 'available-tasks' channel when a task is accepted or cancelled.
        """
        channel = "available-tasks"
        if channel not in self._connections:
            return

        message = json.dumps({
            "type": "task_removed",
            "task_id": task_id,
        })

        dead_connections = set()
        for websocket in list(self._connections[channel]):
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.warning(f"[WS] Failed sending task_removed: {e}")
                dead_connections.add(websocket)

        for ws in dead_connections:
            self._connections[channel].discard(ws)

    def broadcast_task_sync(self, task_id: str, task_data: dict):
        """
        Thread-safe broadcast helper that works from both sync worker threads
        and the main async event loop.
        """
        try:
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.broadcast_task_update(task_id, task_data),
                    self._loop
                )
            else:
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self.broadcast_task_update(task_id, task_data))
                except RuntimeError:
                    pass
        except Exception as e:
            logger.warning(f"[WS] broadcast_task_sync error: {e}")

    def broadcast_new_available_sync(self, task_data: dict):
        """
        Thread-safe broadcast helper for new available tasks.
        """
        try:
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.broadcast_new_task_available(task_data),
                    self._loop
                )
            else:
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self.broadcast_new_task_available(task_data))
                except RuntimeError:
                    pass
        except Exception as e:
            logger.warning(f"[WS] broadcast_new_available_sync error: {e}")

    def broadcast_task_removed_sync(self, task_id: str):
        """
        Thread-safe broadcast helper for removed tasks from available feed.
        """
        try:
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.broadcast_task_removed(task_id),
                    self._loop
                )
            else:
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self.broadcast_task_removed(task_id))
                except RuntimeError:
                    pass
        except Exception as e:
            logger.warning(f"[WS] broadcast_task_removed_sync error: {e}")

    def get_active_connections_count(self) -> int:
        """Returns total number of active WebSocket connections across all channels."""
        return sum(len(conns) for conns in self._connections.values())


# Singleton instance used across the application
manager = ConnectionManager()
