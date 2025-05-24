package models

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type Organization struct {
    ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Name        string            `bson:"name" json:"name"`
    Slug        string            `bson:"slug" json:"slug"`
    Description string            `bson:"description" json:"description"`
    CreatedAt   time.Time         `bson:"created_at" json:"created_at"`
    UpdatedAt   time.Time         `bson:"updated_at" json:"updated_at"`
    Members     []Member          `bson:"members" json:"members"`
}

type Member struct {
    UserID string `bson:"user_id" json:"user_id"`
    Role   string `bson:"role" json:"role"`
    Email  string `bson:"email" json:"email"`
}