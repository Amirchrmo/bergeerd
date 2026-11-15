package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"bergeerd-api/internal/models"
)

// MenuItemRepo persists menu items. Every listing is scoped to a branch.
type MenuItemRepo struct {
	docs[models.MenuItem]
}

// NewMenuItemRepo returns a repository backed by the given database.
func NewMenuItemRepo(db *mongo.Database) *MenuItemRepo {
	return &MenuItemRepo{docs[models.MenuItem]{db.Collection("menu_items")}}
}

// EnsureIndexes creates the index used to list a branch's menu.
func (r *MenuItemRepo) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "branch_id", Value: 1}, {Key: "category", Value: 1}, {Key: "order", Value: 1}},
	})
	return err
}

// itemOrder is the display order within a category: priority, then age.
var itemOrder = bson.D{{Key: "order", Value: 1}, {Key: "created_at", Value: 1}, {Key: "_id", Value: 1}}

// List returns every item of a branch (admin view, including inactive ones).
func (r *MenuItemRepo) List(ctx context.Context, branchID primitive.ObjectID) ([]models.MenuItem, error) {
	return r.find(ctx, bson.M{"branch_id": branchID}, itemOrder)
}

// ListActive returns a branch's visible items in display order.
func (r *MenuItemRepo) ListActive(ctx context.Context, branchID primitive.ObjectID) ([]models.MenuItem, error) {
	return r.find(ctx, bson.M{"branch_id": branchID, "is_active": true}, itemOrder)
}

// Get returns a single item by hex id.
func (r *MenuItemRepo) Get(ctx context.Context, id string) (models.MenuItem, error) {
	return r.byID(ctx, id)
}

// Create inserts a new menu item.
func (r *MenuItemRepo) Create(ctx context.Context, item *models.MenuItem) error {
	stamp(&item.ID, &item.CreatedAt, &item.UpdatedAt)
	_, err := r.col.InsertOne(ctx, item)
	return err
}

// InsertMany inserts several items, filling in ids and timestamps.
func (r *MenuItemRepo) InsertMany(ctx context.Context, items []models.MenuItem) error {
	for i := range items {
		stamp(&items[i].ID, &items[i].CreatedAt, &items[i].UpdatedAt)
	}
	return r.insertMany(ctx, items)
}

// Update sets the given fields on an item.
func (r *MenuItemRepo) Update(ctx context.Context, id string, set bson.M) error {
	return r.setByID(ctx, id, set)
}

// Delete removes a menu item by id.
func (r *MenuItemRepo) Delete(ctx context.Context, id string) error {
	return r.deleteByID(ctx, id)
}

// Count returns the number of items in a branch.
func (r *MenuItemRepo) Count(ctx context.Context, branchID primitive.ObjectID) (int64, error) {
	return r.count(ctx, bson.M{"branch_id": branchID})
}

// CountWithImage returns how many items (in any branch) use the image URL.
// Copied branches share image objects, so an image may only be deleted from
// storage once nothing references it.
func (r *MenuItemRepo) CountWithImage(ctx context.Context, url string) (int64, error) {
	return r.count(ctx, bson.M{"image_url": url})
}

// DeleteByBranch removes all items of a branch.
func (r *MenuItemRepo) DeleteByBranch(ctx context.Context, branchID primitive.ObjectID) error {
	_, err := r.col.DeleteMany(ctx, bson.M{"branch_id": branchID})
	return err
}
