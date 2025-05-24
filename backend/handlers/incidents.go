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

func GetIncidents(c *gin.Context) {
    orgID := c.GetString("organization_id")
    objID, err := primitive.ObjectIDFromHex(orgID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
        return
    }

    collection := database.GetCollection("incidents")
    cursor, err := collection.Find(context.TODO(), bson.M{"organization_id": objID})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incidents"})
        return
    }
    defer cursor.Close(context.TODO())

    var incidents []models.Incident
    if err := cursor.All(context.TODO(), &incidents); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode incidents"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"incidents": incidents})
}

func CreateIncident(c *gin.Context) {
    var incident models.Incident
    if err := c.ShouldBindJSON(&incident); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    orgID := c.GetString("organization_id")
    incident.OrganizationID, _ = primitive.ObjectIDFromHex(orgID)
    incident.Status = models.IncidentStatusInvestigating
    incident.CreatedAt = time.Now()
    incident.UpdatedAt = time.Now()
    incident.CreatedBy = c.GetString("user_id")

    collection := database.GetCollection("incidents")
    result, err := collection.InsertOne(context.TODO(), incident)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create incident"})
        return
    }

    incident.ID = result.InsertedID.(primitive.ObjectID)
    c.JSON(http.StatusCreated, gin.H{"incident": incident})
}

func UpdateIncident(c *gin.Context) {
    incidentID := c.Param("id")
    objID, err := primitive.ObjectIDFromHex(incidentID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident ID"})
        return
    }

    var update struct {
        Title       string                   `json:"title"`
        Description string                   `json:"description"`
        Status      models.IncidentStatus    `json:"status"`
        Type        string                   `json:"type"`
        AffectedServices []primitive.ObjectID `json:"affected_services"`
    }

    if err := c.ShouldBindJSON(&update); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    collection := database.GetCollection("incidents")
    updateDoc := bson.M{
        "$set": bson.M{
            "title":             update.Title,
            "description":       update.Description,
            "status":            update.Status,
            "type":              update.Type,
            "affected_services": update.AffectedServices,
            "updated_at":        time.Now(),
        },
    }

    // If resolving, set resolved_at
    if update.Status == models.IncidentStatusResolved {
        updateDoc["$set"].(bson.M)["resolved_at"] = time.Now()
    }

    _, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objID}, updateDoc)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update incident"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Incident updated successfully"})
}