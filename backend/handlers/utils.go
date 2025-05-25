package handlers

import (
    "log"

    "github.com/gin-gonic/gin"
    "status-page-backend/websocket"
)

// BroadcastWebSocket is a shared helper function to broadcast WebSocket messages
func BroadcastWebSocket(c *gin.Context, message websocket.Message) {
    if hub, exists := c.Get("websocket_hub"); exists {
        if wsHub, ok := hub.(*websocket.Hub); ok {
            log.Printf("📡 Broadcasting WebSocket message: %s", message.Type)
            wsHub.Broadcast(message)
        } else {
            log.Printf("❌ WebSocket hub type assertion failed")
        }
    } else {
        log.Printf("❌ WebSocket hub not found in context")
    }
}