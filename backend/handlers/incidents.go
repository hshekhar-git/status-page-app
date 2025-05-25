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

func GetIncidents(c *gin.Context) {
    orgID := c.GetString("organization_id")
    objID, err := primitive.ObjectIDFromHex(orgID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
        return
    }

    collection := database.GetCollection("incidents")
    filter := bson.M{
        "organization_id": objID,
        "deleted":         bson.M{"$ne": true},
    }
    
    cursor, err := collection.Find(context.TODO(), filter)
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
        log.Printf("Error creating incident: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create incident"})
        return
    }

    incident.ID = result.InsertedID.(primitive.ObjectID)

    // Broadcast incident creation via WebSocket
    websocketMessage := websocket.Message{
        Type: "incident_created",
        Data: map[string]interface{}{
            "incident_id":       incident.ID.Hex(),
            "incident_title":    incident.Title,
            "incident_desc":     incident.Description,
            "incident_status":   string(incident.Status),
            "incident_type":     incident.Type,
            "organization_id":   incident.OrganizationID.Hex(),
            "affected_services": incident.AffectedServices,
            "action":            "incident_created",
            "timestamp":         time.Now().Unix(),
        },
    }
    BroadcastWebSocket(c, websocketMessage)

    log.Printf("✅ Incident created: %s", incident.Title)
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
        Title            string                   `json:"title"`
        Description      string                   `json:"description"`
        Status           models.IncidentStatus    `json:"status"`
        Type             string                   `json:"type"`
        AffectedServices []primitive.ObjectID     `json:"affected_services"`
    }

    if err := c.ShouldBindJSON(&update); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Get existing incident for broadcasting
    collection := database.GetCollection("incidents")
    var existingIncident models.Incident
    err = collection.FindOne(context.TODO(), bson.M{
        "_id":     objID,
        "deleted": bson.M{"$ne": true},
    }).Decode(&existingIncident)
    
    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{"error": "Incident not found"})
        } else {
            log.Printf("Error finding incident: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
        }
        return
    }

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

    _, err = collection.UpdateOne(
        context.TODO(), 
        bson.M{
            "_id":     objID,
            "deleted": bson.M{"$ne": true},
        }, 
        updateDoc,
    )
    if err != nil {
        log.Printf("Error updating incident: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update incident"})
        return
    }

    // Broadcast incident update via WebSocket
    websocketMessage := websocket.Message{
        Type: "incident_updated",
        Data: map[string]interface{}{
            "incident_id":       incidentID,
            "incident_title":    update.Title,
            "incident_desc":     update.Description,
            "old_status":        string(existingIncident.Status),
            "new_status":        string(update.Status),
            "incident_type":     update.Type,
            "organization_id":   existingIncident.OrganizationID.Hex(),
            "affected_services": update.AffectedServices,
            "action":            "incident_updated",
            "timestamp":         time.Now().Unix(),
        },
    }
    BroadcastWebSocket(c, websocketMessage)

    log.Printf("✅ Incident updated: %s (%s -> %s)", update.Title, existingIncident.Status, update.Status)
    c.JSON(http.StatusOK, gin.H{"message": "Incident updated successfully"})
}