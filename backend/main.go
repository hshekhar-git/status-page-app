package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "github.com/joho/godotenv"

    "status-page-backend/database"
    "status-page-backend/handlers"
    "status-page-backend/middleware"
    "status-page-backend/websocket"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using system environment variables")
    }

    // Get environment variables
    mongoURI := os.Getenv("MONGODB_URI")
    if mongoURI == "" {
        mongoURI = "mongodb://localhost:27017"
    }

    dbName := os.Getenv("DB_NAME")
    if dbName == "" {
        dbName = "statuspage"
    }

    // Connect to database
    if err := database.ConnectDB(mongoURI, dbName); err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Initialize WebSocket hub
    hub := websocket.NewHub()
    go hub.Run()
    log.Println("✅ WebSocket hub started")

    // Setup Gin router
    r := gin.Default()

    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"}, 
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"*"},
        AllowCredentials: true,
    }))

    // Middleware to add WebSocket hub to context
    r.Use(func(c *gin.Context) {
        c.Set("websocket_hub", hub)
        c.Next()
    })

    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status": "ok",
            "websocket_clients": len(hub.GetClients()), // We'll add this method
        })
    })

    // WebSocket endpoint
    r.GET("/ws", func(c *gin.Context) {
        log.Println("🔌 New WebSocket connection attempt")
        hub.HandleWebSocket(c)
    })

    // Public API (no auth required)
    public := r.Group("/api/public")
    {
        public.GET("/status/:slug", handlers.GetPublicStatus)
    }

    // Protected API routes
    api := r.Group("/api")
    api.Use(middleware.AuthMiddleware())
    api.Use(middleware.TenantMiddleware())
    {
        // Organization routes
        api.GET("/organizations", handlers.GetOrganizations)
        api.POST("/organizations", handlers.CreateOrganization)

        // Service routes
        api.GET("/services", handlers.GetServices)
        api.POST("/services", handlers.CreateService)
        api.PUT("/services/:id/status", handlers.UpdateServiceStatus) 
        api.DELETE("/services/:id", handlers.DeleteService)

        // Incident routes
        api.GET("/incidents", handlers.GetIncidents)
        api.POST("/incidents", handlers.CreateIncident)    
        api.PUT("/incidents/:id", handlers.UpdateIncident) 
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("🚀 Server starting on port %s", port)
    log.Printf("🏥 Health check: http://localhost:%s/health", port)
    log.Printf("🔌 WebSocket: ws://localhost:%s/ws", port)
    log.Printf("🌍 Public API: http://localhost:%s/api/public/status/demo", port)
    
    if err := r.Run(":" + port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}