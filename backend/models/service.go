package models

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type ServiceStatus string

const (
    StatusOperational      ServiceStatus = "operational"
    StatusDegradedPerf    ServiceStatus = "degraded_performance"
    StatusPartialOutage   ServiceStatus = "partial_outage"
    StatusMajorOutage     ServiceStatus = "major_outage"
    StatusMaintenance     ServiceStatus = "maintenance"
)

type Service struct {
    ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    OrganizationID primitive.ObjectID `bson:"organization_id" json:"organization_id"`
    Name           string             `bson:"name" json:"name"`
    Description    string             `bson:"description" json:"description"`
    Status         ServiceStatus      `bson:"status" json:"status"`
    URL            string             `bson:"url" json:"url"`
    CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
    UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
}