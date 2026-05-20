from __future__ import annotations

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.core.websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket, token: str = Query(...)) -> None:
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
