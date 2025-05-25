package handlers

import (
    "context"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"

    "status-page-backend/database"
    "status-page-backend/models"
)

func GetServices(c *gin.Context) {
    orgID := c.GetString("organization_id")
    objID, err := primitive.ObjectIDFromHex(orgID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
        return
    }

    collection := database.GetCollection("services")
    cursor, err := collection.Find(context.TODO(), bson.M{
        "organization_id": objID,
        "deleted": bson.M{"$ne": true},
    })
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
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
        return
    }

    service.ID = result.InsertedID.(primitive.ObjectID)
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

    collection := database.GetCollection("services")
    _, err = collection.UpdateOne(
        context.TODO(),
        bson.M{"_id": objID},
        bson.M{
            "$set": bson.M{
                "status":     update.Status,
                "updated_at": time.Now(),
            },
        },
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
        return
    }

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
    _, err = collection.UpdateOne(
        context.TODO(),
        bson.M{"_id": objID},
        bson.M{"$set": bson.M{"deleted": true, "updated_at": time.Now()}},
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Service deleted (flagged) successfully"})
}