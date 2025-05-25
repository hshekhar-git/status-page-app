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
    
    // Find organization by slug (exclude deleted orgs)
    orgCollection := database.GetCollection("organizations")
    var org models.Organization
    orgFilter := bson.M{
        "slug":    slug,
        "deleted": bson.M{"$ne": true}, // Exclude where deleted=true, include where deleted field doesn't exist
    }
    
    err := orgCollection.FindOne(context.TODO(), orgFilter).Decode(&org)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
        } else {
            log.Printf("Error finding organization: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
        }
        return
    }

    // Initialize empty slices to avoid null in JSON response
    var services []models.Service = make([]models.Service, 0)
    var incidents []models.Incident = make([]models.Incident, 0)

    // Get non-deleted services for this organization
    servicesCollection := database.GetCollection("services")
    servicesFilter := bson.M{
        "organization_id": org.ID,
        "deleted":         bson.M{"$ne": true}, // Only show services where deleted is NOT true
    }
    
    cursor, err := servicesCollection.Find(context.TODO(), servicesFilter)
    if err != nil {
        log.Printf("Error finding services: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
        return
    }
    defer cursor.Close(context.TODO())

    if err := cursor.All(context.TODO(), &services); err != nil {
        log.Printf("Error decoding services: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode services"})
        return
    }

    // Get non-deleted incidents for this organization
    incidentsCollection := database.GetCollection("incidents")
    incidentsFilter := bson.M{
        "organization_id": org.ID,
        "deleted":         bson.M{"$ne": true}, // Only show incidents where deleted is NOT true
    }

    // Sort by created_at descending, limit to 10 most recent
    findOptions := options.Find().
        SetSort(bson.D{{"created_at", -1}}).
        SetLimit(10)
    
    incidentsCursor, err := incidentsCollection.Find(context.TODO(), incidentsFilter, findOptions)
    if err != nil {
        log.Printf("Error finding incidents: %v", err)
        // Don't fail the entire request if incidents fail
        log.Println("Continuing without incidents due to error")
    } else {
        defer incidentsCursor.Close(context.TODO())
        
        if err := incidentsCursor.All(context.TODO(), &incidents); err != nil {
            log.Printf("Error decoding incidents: %v", err)
            incidents = make([]models.Incident, 0)
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "organization": org,
        "services":     services,
        "incidents":    incidents,
    })
}
    slug := c.Param("slug")
    
    // Find organization by slug (exclude deleted orgs)
    orgCollection := database.GetCollection("organizations")
    var org models.Organization
    orgFilter := bson.M{
        "slug": slug,
        "$or": []bson.M{
            {"deleted": bson.M{"$exists": false}},
            {"deleted": false},
        },
    }
    
    err := orgCollection.FindOne(context.TODO(), orgFilter).Decode(&org)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
        } else {
            log.Printf("Error finding organization: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
        }
        return
    }

    // Initialize empty slices to avoid null in JSON response
    var services []models.Service = make([]models.Service, 0)
    var incidents []models.Incident = make([]models.Incident, 0)

    // Get non-deleted services for this organization
    servicesCollection := database.GetCollection("services")
    servicesFilter := bson.M{
        "organization_id": org.ID,
        "$or": []bson.M{
            {"deleted": bson.M{"$exists": false}},
            {"deleted": false},
        },
    }
    
    cursor, err := servicesCollection.Find(context.TODO(), servicesFilter)
    if err != nil {
        log.Printf("Error finding services: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
        return
    }
    defer cursor.Close(context.TODO())

    if err := cursor.All(context.TODO(), &services); err != nil {
        log.Printf("Error decoding services: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode services"})
        return
    }

    // Get non-deleted incidents for this organization
    incidentsCollection := database.GetCollection("incidents")
    incidentsFilter := bson.M{
        "organization_id": org.ID,
        "$or": []bson.M{
            {"deleted": bson.M{"$exists": false}},
            {"deleted": false},
        },
    }

    // Sort by created_at descending, limit to 10 most recent
    findOptions := options.Find().
        SetSort(bson.D{{"created_at", -1}}).
        SetLimit(10)
    
    incidentsCursor, err := incidentsCollection.Find(context.TODO(), incidentsFilter, findOptions)
    if err != nil {
        log.Printf("Error finding incidents: %v", err)
        // Don't fail the entire request if incidents fail
        log.Println("Continuing without incidents due to error")
    } else {
        defer incidentsCursor.Close(context.TODO())
        
        if err := incidentsCursor.All(context.TODO(), &incidents); err != nil {
            log.Printf("Error decoding incidents: %v", err)
            incidents = make([]models.Incident, 0)
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "organization": org,
        "services":     services,
        "incidents":    incidents,
    })