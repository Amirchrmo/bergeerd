package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bergeerd-api/internal/models"
)

// AdminRepo persists admin accounts.
type AdminRepo struct {
	docs[models.Admin]
}

// NewAdminRepo returns a repository backed by the given database.
func NewAdminRepo(db *mongo.Database) *AdminRepo {
	return &AdminRepo{docs[models.Admin]{db.Collection("admins")}}
}

// EnsureIndexes creates a unique index on username.
func (r *AdminRepo) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

// FindByUsername loads an admin by username.
func (r *AdminRepo) FindByUsername(ctx context.Context, username string) (models.Admin, error) {
	return r.findOne(ctx, bson.M{"username": username})
}

// Count returns the number of admin accounts (used to decide seeding).
func (r *AdminRepo) Count(ctx context.Context) (int64, error) {
	return r.count(ctx, bson.M{})
}

// Create inserts a new admin account.
func (r *AdminRepo) Create(ctx context.Context, admin *models.Admin) error {
	stamp(&admin.ID, &admin.CreatedAt, &admin.UpdatedAt)
	_, err := r.col.InsertOne(ctx, admin)
	return err
}
