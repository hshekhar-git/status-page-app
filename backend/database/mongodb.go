package database

import (
    "context"
    "log"
    "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB(uri, dbName string) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
    if err != nil {
        return err
    }

    if err := client.Ping(ctx, nil); err != nil {
        return err
    }

    DB = client.Database(dbName)
    log.Println("Connected to MongoDB successfully")
    return nil
}

func GetCollection(collectionName string) *mongo.Collection {
    return DB.Collection(collectionName)
}