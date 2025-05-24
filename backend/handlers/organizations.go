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

func CreateOrganization(c *gin.Context) {
    var org models.Organization
    if err := c.ShouldBindJSON(&org); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    org.CreatedAt = time.Now()
    org.UpdatedAt = time.Now()

    collection := database.GetCollection("organizations")
    result, err := collection.InsertOne(context.TODO(), org)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
        return
    }

    org.ID = result.InsertedID.(primitive.ObjectID)
    c.JSON(http.StatusCreated, gin.H{"organization": org})
}

func GetOrganizations(c *gin.Context) {
    collection := database.GetCollection("organizations")
    cursor, err := collection.Find(context.TODO(), bson.M{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
        return
    }
    defer cursor.Close(context.TODO())

    var organizations []models.Organization
    if err := cursor.All(context.TODO(), &organizations); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode organizations"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"organizations": organizations})
}

func GetPublicStatus(c *gin.Context) {
    slug := c.Param("slug")
    
    // Find organization by slug
    orgCollection := database.GetCollection("organizations")
    var org models.Organization
    err := orgCollection.FindOne(context.TODO(), bson.M{"slug": slug}).Decode(&org)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
        return
    }

    // Get services for this organization
    servicesCollection := database.GetCollection("services")
    cursor, err := servicesCollection.Find(context.TODO(), bson.M{"organization_id": org.ID})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
        return
    }
    defer cursor.Close(context.TODO())

    var services []models.Service
    cursor.All(context.TODO(), &services)

    // Get active incidents
    incidentsCollection := database.GetCollection("incidents")
    incidentsCursor, err := incidentsCollection.Find(context.TODO(), bson.M{
        "organization_id": org.ID,
        "status": bson.M{"$ne": "resolved"},
    })
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incidents"})
        return
    }
    defer incidentsCursor.Close(context.TODO())

    var incidents []models.Incident
    incidentsCursor.All(context.TODO(), &incidents)

    c.JSON(http.StatusOK, gin.H{
        "organization": org,
        "services":     services,
        "incidents":    incidents,
    })
}