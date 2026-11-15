package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bergeerd-api/internal/models"
)

// CategoryRepo persists menu categories. Every query is scoped to a branch.
type CategoryRepo struct {
	docs[models.Category]
}

// NewCategoryRepo returns a repository backed by the given database.
func NewCategoryRepo(db *mongo.Database) *CategoryRepo {
	return &CategoryRepo{docs[models.Category]{db.Collection("categories")}}
}

// EnsureIndexes makes slugs unique within a branch.
func (r *CategoryRepo) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "branch_id", Value: 1}, {Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "branch_id", Value: 1}, {Key: "order", Value: 1}}},
	})
	return err
}

// List returns a branch's categories in display order.
func (r *CategoryRepo) List(ctx context.Context, branchID primitive.ObjectID) ([]models.Category, error) {
	return r.find(ctx, bson.M{"branch_id": branchID},
		bson.D{{Key: "order", Value: 1}, {Key: "_id", Value: 1}})
}

// Get returns a category by hex id.
func (r *CategoryRepo) Get(ctx context.Context, id string) (models.Category, error) {
	return r.byID(ctx, id)
}

// FindBySlug returns the category with the given slug in a branch.
func (r *CategoryRepo) FindBySlug(ctx context.Context, branchID primitive.ObjectID, slug string) (models.Category, error) {
	return r.findOne(ctx, bson.M{"branch_id": branchID, "slug": slug})
}

// Create inserts a new category.
func (r *CategoryRepo) Create(ctx context.Context, cat *models.Category) error {
	stamp(&cat.ID, &cat.CreatedAt, &cat.UpdatedAt)
	_, err := r.col.InsertOne(ctx, cat)
	return err
}

// InsertMany inserts several categories, filling in ids and timestamps.
func (r *CategoryRepo) InsertMany(ctx context.Context, cats []models.Category) error {
	for i := range cats {
		stamp(&cats[i].ID, &cats[i].CreatedAt, &cats[i].UpdatedAt)
	}
	return r.insertMany(ctx, cats)
}

// Update sets the given fields on a category.
func (r *CategoryRepo) Update(ctx context.Context, id string, set bson.M) error {
	return r.setByID(ctx, id, set)
}

// Delete removes a category by id.
func (r *CategoryRepo) Delete(ctx context.Context, id string) error {
	return r.deleteByID(ctx, id)
}

// Count returns the number of categories in a branch.
func (r *CategoryRepo) Count(ctx context.Context, branchID primitive.ObjectID) (int64, error) {
	return r.count(ctx, bson.M{"branch_id": branchID})
}

// DeleteByBranch removes all categories of a branch.
func (r *CategoryRepo) DeleteByBranch(ctx context.Context, branchID primitive.ObjectID) error {
	_, err := r.col.DeleteMany(ctx, bson.M{"branch_id": branchID})
	return err
}
