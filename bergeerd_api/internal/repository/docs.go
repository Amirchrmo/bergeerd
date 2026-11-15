package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound is returned when no document matches the query.
var ErrNotFound = errors.New("document not found")

// ObjectID parses a hex id; malformed ids are reported as ErrNotFound so the
// API answers 404 instead of leaking parse errors.
func ObjectID(id string) (primitive.ObjectID, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return primitive.NilObjectID, ErrNotFound
	}
	return oid, nil
}

// docs holds the CRUD plumbing shared by every collection.
type docs[T any] struct {
	col *mongo.Collection
}

func (d docs[T]) findOne(ctx context.Context, filter any) (T, error) {
	var out T
	err := d.col.FindOne(ctx, filter).Decode(&out)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return out, ErrNotFound
	}
	return out, err
}

func (d docs[T]) byID(ctx context.Context, id string) (T, error) {
	oid, err := ObjectID(id)
	if err != nil {
		var zero T
		return zero, err
	}
	return d.findOne(ctx, bson.M{"_id": oid})
}

// find returns all matches in the given order (never nil).
func (d docs[T]) find(ctx context.Context, filter any, sort bson.D) ([]T, error) {
	cur, err := d.col.Find(ctx, filter, options.Find().SetSort(sort))
	if err != nil {
		return nil, err
	}
	out := []T{}
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// setByID applies a $set (plus updated_at) to one document.
func (d docs[T]) setByID(ctx context.Context, id string, set bson.M) error {
	oid, err := ObjectID(id)
	if err != nil {
		return err
	}
	set["updated_at"] = time.Now().UTC()
	res, err := d.col.UpdateByID(ctx, oid, bson.M{"$set": set})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (d docs[T]) deleteByID(ctx context.Context, id string) error {
	oid, err := ObjectID(id)
	if err != nil {
		return err
	}
	res, err := d.col.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (d docs[T]) insertMany(ctx context.Context, items []T) error {
	if len(items) == 0 {
		return nil
	}
	batch := make([]any, len(items))
	for i := range items {
		batch[i] = items[i]
	}
	_, err := d.col.InsertMany(ctx, batch)
	return err
}

func (d docs[T]) count(ctx context.Context, filter any) (int64, error) {
	return d.col.CountDocuments(ctx, filter)
}

// stamp fills in a new document's id and timestamps.
func stamp(id *primitive.ObjectID, created, updated *time.Time) {
	if id.IsZero() {
		*id = primitive.NewObjectID()
	}
	now := time.Now().UTC()
	if created.IsZero() {
		*created = now
	}
	*updated = now
}
