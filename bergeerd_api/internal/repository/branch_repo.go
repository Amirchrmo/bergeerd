package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bergeerd-api/internal/models"
)

// BranchRepo persists restaurant branches.
type BranchRepo struct {
	docs[models.Branch]
}

// NewBranchRepo returns a repository backed by the given database.
func NewBranchRepo(db *mongo.Database) *BranchRepo {
	return &BranchRepo{docs[models.Branch]{db.Collection("branches")}}
}

// EnsureIndexes makes slugs unique and allows at most one default branch.
func (r *BranchRepo) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "slug", Value: 1}}, Options: options.Index().SetUnique(true)},
		{
			Keys: bson.D{{Key: "is_default", Value: 1}},
			Options: options.Index().SetUnique(true).
				SetPartialFilterExpression(bson.M{"is_default": true}),
		},
	})
	return err
}

// List returns every branch, default first, then by order.
func (r *BranchRepo) List(ctx context.Context) ([]models.Branch, error) {
	return r.find(ctx, bson.M{}, bson.D{
		{Key: "is_default", Value: -1}, {Key: "order", Value: 1}, {Key: "_id", Value: 1},
	})
}

// Get returns a branch by hex id.
func (r *BranchRepo) Get(ctx context.Context, id string) (models.Branch, error) {
	return r.byID(ctx, id)
}

// FindBySlug returns the branch with the given slug.
func (r *BranchRepo) FindBySlug(ctx context.Context, slug string) (models.Branch, error) {
	return r.findOne(ctx, bson.M{"slug": slug})
}

// FindDefault returns the default branch.
func (r *BranchRepo) FindDefault(ctx context.Context) (models.Branch, error) {
	return r.findOne(ctx, bson.M{"is_default": true})
}

// Create inserts a new branch.
func (r *BranchRepo) Create(ctx context.Context, b *models.Branch) error {
	stamp(&b.ID, &b.CreatedAt, &b.UpdatedAt)
	_, err := r.col.InsertOne(ctx, b)
	return err
}

// Update sets the given fields on a branch.
func (r *BranchRepo) Update(ctx context.Context, id string, set bson.M) error {
	return r.setByID(ctx, id, set)
}

// Delete removes a branch document (its menu is removed by the service).
func (r *BranchRepo) Delete(ctx context.Context, id string) error {
	return r.deleteByID(ctx, id)
}
