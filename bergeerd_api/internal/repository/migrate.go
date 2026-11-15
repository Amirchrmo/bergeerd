package repository

import (
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"bergeerd-api/internal/models"
)

// legacyIndexes are the indexes of the single-branch schema. The unique
// category slug index in particular must go: it would stop two branches from
// both having a "burgers" category.
var legacyIndexes = map[string][]string{
	"categories": {"slug_1", "order_1__id_1"},
	"menu_items": {"category_1_order_1__id_1", "is_active_1"},
}

// MigrateToBranches upgrades a single-menu database to the multi-branch schema
// and returns the default branch. It is idempotent and runs on every start:
//
//  1. creates the default branch from seed when there is none;
//  2. assigns categories and menu items without a branch to it, so the
//     existing menu keeps being served at the site root;
//  3. drops the legacy indexes (EnsureIndexes then creates the new ones).
func MigrateToBranches(ctx context.Context, db *mongo.Database, seed models.Branch) (models.Branch, error) {
	branches := NewBranchRepo(db)
	def, err := branches.FindDefault(ctx)
	if errors.Is(err, ErrNotFound) {
		def = seed
		def.IsDefault, def.IsActive = true, true
		err = branches.Create(ctx, &def)
	}
	if err != nil {
		return models.Branch{}, fmt.Errorf("default branch: %w", err)
	}

	orphans := bson.M{"branch_id": bson.M{"$exists": false}}
	assign := bson.M{"$set": bson.M{"branch_id": def.ID}}
	for _, col := range []string{"categories", "menu_items"} {
		if _, err := db.Collection(col).UpdateMany(ctx, orphans, assign); err != nil {
			return models.Branch{}, fmt.Errorf("assign %s to default branch: %w", col, err)
		}
	}

	for col, names := range legacyIndexes {
		for _, name := range names {
			_, err := db.Collection(col).Indexes().DropOne(ctx, name)
			if err != nil && !isMissing(err) {
				return models.Branch{}, fmt.Errorf("drop legacy index %s.%s: %w", col, name, err)
			}
		}
	}
	return def, nil
}

// isMissing reports whether a dropIndexes error only means there was nothing
// to drop (IndexNotFound, or the collection does not exist yet).
func isMissing(err error) bool {
	var ce mongo.CommandError
	return errors.As(err, &ce) && (ce.Code == 27 || ce.Code == 26)
}
