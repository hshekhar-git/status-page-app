package handlers

import (
    "context"
    "net/http"
    "time"
    "log"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"

    "status-page-backend/database"
    "status-page-backend/models"
    "status-page-backend/websocket"
)

func GetServices(c *gin.Context) {
    orgID := c.GetString("organization_id")
    objID, err := primitive.ObjectIDFromHex(orgID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
        return
    }

    collection := database.GetCollection("services")
    filter := bson.M{
        "organization_id": objID,
        "deleted":         bson.M{"$ne": true},
    }
    
    cursor, err := collection.Find(context.TODO(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
        return
    }
    defer cursor.Close(context.TODO())

    var services []models.Service
    if err := cursor.All(context.TODO(), &services); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode services"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"services": services})
}

func CreateService(c *gin.Context) {
    var service models.Service
    if err := c.ShouldBindJSON(&service); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    orgID := c.GetString("organization_id")
    service.OrganizationID, _ = primitive.ObjectIDFromHex(orgID)
    service.Status = models.StatusOperational
    service.CreatedAt = time.Now()
    service.UpdatedAt = time.Now()

    collection := database.GetCollection("services")
    result, err := collection.InsertOne(context.TODO(), service)
    if err != nil {
        log.Printf("Error creating service: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
        return
    }

    service.ID = result.InsertedID.(primitive.ObjectID)

    // Broadcast service creation via WebSocket
    websocketMessage := websocket.Message{
        Type: "service_created",
        Data: map[string]interface{}{
            "service_id":      service.ID.Hex(),
            "service_name":    service.Name,
            "service_status":  string(service.Status),
            "service_desc":    service.Description,
            "service_url":     service.URL,
            "organization_id": service.OrganizationID.Hex(),
            "action":          "service_created",
            "timestamp":       time.Now().Unix(),
        },
    }
    BroadcastWebSocket(c, websocketMessage)

    log.Printf("✅ Service created: %s", service.Name)
    c.JSON(http.StatusCreated, gin.H{"service": service})
}

func UpdateServiceStatus(c *gin.Context) {
    serviceID := c.Param("id")
    objID, err := primitive.ObjectIDFromHex(serviceID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
        return
    }

    var update struct {
        Status  models.ServiceStatus `json:"status"`
        Message string               `json:"message"`
    }

    if err := c.ShouldBindJSON(&update); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Get existing service for broadcasting
    collection := database.GetCollection("services")
    var existingService models.Service
    err = collection.FindOne(context.TODO(), bson.M{
        "_id":     objID,
        "deleted": bson.M{"$ne": true},
    }).Decode(&existingService)
    
    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
        } else {
            log.Printf("Error finding service: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
        }
        return
    }

    // Update service status
    _, err = collection.UpdateOne(
        context.TODO(),
        bson.M{
            "_id":     objID,
            "deleted": bson.M{"$ne": true},
        },
        bson.M{
            "$set": bson.M{
                "status":     update.Status,
                "updated_at": time.Now(),
            },
        },
    )
    if err != nil {
        log.Printf("Error updating service status: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
        return
    }

    // Broadcast status update via WebSocket
    websocketMessage := websocket.Message{
        Type: "status_update",
        Data: map[string]interface{}{
            "service_id":      serviceID,
            "service_name":    existingService.Name,
            "old_status":      string(existingService.Status),
            "new_status":      string(update.Status),
            "message":         update.Message,
            "organization_id": existingService.OrganizationID.Hex(),
            "action":          "service_status_updated",
            "timestamp":       time.Now().Unix(),
        },
    }
    BroadcastWebSocket(c, websocketMessage)

    log.Printf("✅ Service status updated: %s -> %s", existingService.Name, update.Status)
    c.JSON(http.StatusOK, gin.H{"message": "Service status updated successfully"})
}

func DeleteService(c *gin.Context) {
    serviceID := c.Param("id")
    objID, err := primitive.ObjectIDFromHex(serviceID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
        return
    }

    collection := database.GetCollection("services")
    
    // Get service info before deletion for broadcasting
    var service models.Service
    err = collection.FindOne(context.TODO(), bson.M{
        "_id":     objID,
        "deleted": bson.M{"$ne": true},
    }).Decode(&service)
    
    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
        } else {
            log.Printf("Error finding service for deletion: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
        }
        return
    }

    // Soft delete: set deleted = true
    _, err = collection.UpdateOne(
        context.TODO(),
        bson.M{"_id": objID},
        bson.M{
            "$set": bson.M{
                "deleted":    true,
                "updated_at": time.Now(),
            },
        },
    )
    if err != nil {
        log.Printf("Error deleting service: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
        return
    }

    // Broadcast service deletion via WebSocket
    websocketMessage := websocket.Message{
        Type: "service_deleted",
        Data: map[string]interface{}{
            "service_id":      serviceID,
            "service_name":    service.Name,
            "organization_id": service.OrganizationID.Hex(),
            "action":          "service_deleted",
            "timestamp":       time.Now().Unix(),
        },
    }
    BroadcastWebSocket(c, websocketMessage)

    log.Printf("✅ Service deleted: %s", service.Name)
    c.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
}