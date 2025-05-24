package models

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type IncidentStatus string

const (
    IncidentStatusInvestigating IncidentStatus = "investigating"
    IncidentStatusIdentified    IncidentStatus = "identified"
    IncidentStatusMonitoring    IncidentStatus = "monitoring"
    IncidentStatusResolved      IncidentStatus = "resolved"
)

type Incident struct {
    ID             primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
    OrganizationID primitive.ObjectID   `bson:"organization_id" json:"organization_id"`
    Title          string               `bson:"title" json:"title"`
    Description    string               `bson:"description" json:"description"`
    Status         IncidentStatus       `bson:"status" json:"status"`
    Type           string               `bson:"type" json:"type"`
    AffectedServices []primitive.ObjectID `bson:"affected_services" json:"affected_services"`
    CreatedAt      time.Time            `bson:"created_at" json:"created_at"`
    UpdatedAt      time.Time            `bson:"updated_at" json:"updated_at"`
    CreatedBy      string               `bson:"created_by" json:"created_by"`
}