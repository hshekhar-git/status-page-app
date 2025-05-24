package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
)

// Simple auth middleware for testing - replace with Clerk later
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        
        // For testing, allow requests without auth or with "Bearer test"
        if authHeader == "" || authHeader == "Bearer test" {
            c.Set("user_id", "test_user_123")
            c.Set("user_email", "test@example.com")
            c.Next()
            return
        }

        // Remove Bearer prefix
        token := strings.Replace(authHeader, "Bearer ", "", 1)
        
        // Simple validation for testing
        if token == "test" {
            c.Set("user_id", "test_user_123")
            c.Set("user_email", "test@example.com")
            c.Next()
            return
        }

        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
        c.Abort()
    }
}

// Extract organization ID from request
func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // For testing, use a default org ID
        orgID := c.GetHeader("X-Organization-ID")
        if orgID == "" {
            orgID = "68323d8ecfc5cd8248620005" // Default test org ID
        }
        c.Set("organization_id", orgID)
        c.Next()
    }
}