package service_test

// Integration tests against a real MongoDB. They create and drop a throwaway
// database; run with e.g.
//
//	BERGEERD_TEST_MONGO_URI=mongodb://localhost:27017 go test ./...

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"slices"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bergeerd-api/internal/database"
	"bergeerd-api/internal/models"
	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/seeder"
	"bergeerd-api/internal/service"
	"bergeerd-api/internal/storage"
	"bergeerd-api/internal/validation"
)

type fakeImages struct{ deleted []string }

func (f *fakeImages) UploadImage(_ context.Context, _ io.Reader, _ int64, name, _ string) (storage.UploadResult, error) {
	return storage.UploadResult{URL: "https://img.test/" + name}, nil
}

func (f *fakeImages) DeleteByURL(_ context.Context, url string) error {
	f.deleted = append(f.deleted, url)
	return nil
}

type env struct {
	ctx      context.Context
	db       *mongo.Database
	images   *fakeImages
	cats     *service.CategoryService
	menu     *service.MenuService
	branches *service.BranchService
}

func newEnv(t *testing.T) *env {
	t.Helper()
	uri := os.Getenv("BERGEERD_TEST_MONGO_URI")
	if uri == "" {
		t.Skip("set BERGEERD_TEST_MONGO_URI (e.g. mongodb://localhost:27017) to run")
	}
	db, err := database.ConnectMongo(uri, fmt.Sprintf("bergeerd_test_%d", time.Now().UnixNano()))
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	t.Cleanup(func() {
		_ = db.Drop(ctx)
		_ = db.Client().Disconnect(ctx)
	})
	images := &fakeImages{}
	cats := service.NewCategoryService(repository.NewCategoryRepo(db))
	menu := service.NewMenuService(repository.NewMenuItemRepo(db), images, cats)
	return &env{
		ctx: ctx, db: db, images: images, cats: cats, menu: menu,
		branches: service.NewBranchService(repository.NewBranchRepo(db), cats, menu),
	}
}

// migrate runs the startup sequence of cmd/api: migration, then indexes.
func (e *env) migrate(t *testing.T) models.Branch {
	t.Helper()
	def, err := repository.MigrateToBranches(e.ctx, e.db, seeder.DefaultBranch())
	if err != nil {
		t.Fatal(err)
	}
	for _, ensure := range []func(context.Context) error{
		repository.NewBranchRepo(e.db).EnsureIndexes,
		repository.NewCategoryRepo(e.db).EnsureIndexes,
		repository.NewMenuItemRepo(e.db).EnsureIndexes,
	} {
		if err := ensure(e.ctx); err != nil {
			t.Fatal(err)
		}
	}
	return def
}

func ptr[T any](v T) *T { return &v }

// must unwraps (value, error) results; a panic fails the test with a trace.
func must[T any](v T, err error) T {
	if err != nil {
		panic(err)
	}
	return v
}

func isValidation(err error) bool { return validation.AsValidationError(err) != nil }

// TestMigrationKeepsExistingMenu starts from the pre-branch production schema
// (no branch_id anywhere, global unique category slug) and checks the menu is
// still served unchanged by the default branch.
func TestMigrationKeepsExistingMenu(t *testing.T) {
	e := newEnv(t)
	now := time.Now().UTC()
	cats := e.db.Collection("categories")
	items := e.db.Collection("menu_items")
	_, err := cats.Indexes().CreateMany(e.ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "slug", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "order", Value: 1}, {Key: "_id", Value: 1}}},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = items.Indexes().CreateMany(e.ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "category", Value: 1}, {Key: "order", Value: 1}, {Key: "_id", Value: 1}}},
		{Keys: bson.D{{Key: "is_active", Value: 1}}},
	})
	if err != nil {
		t.Fatal(err)
	}
	must(cats.InsertMany(e.ctx, []any{
		bson.M{"slug": "drinks", "title": "نوشیدنی‌ها", "order": 2, "is_active": true, "created_at": now, "updated_at": now},
		bson.M{"slug": "burgers", "title": "برگرها", "order": 1, "is_active": true, "created_at": now, "updated_at": now},
	}))
	must(items.InsertMany(e.ctx, []any{
		bson.M{"name": "کولا", "price": "۸۵", "category": "drinks", "order": 1, "is_active": true, "created_at": now},
		bson.M{"name": "چیز", "price": "۶۶۰", "category": "burgers", "order": 2, "is_active": true, "created_at": now},
		bson.M{"name": "کلاسیک", "price": "۵۹۰", "category": "burgers", "order": 1, "is_active": true, "created_at": now},
		bson.M{"name": "پنهان", "price": "۱", "category": "burgers", "order": 0, "is_active": false, "created_at": now},
	}))

	def := e.migrate(t)
	if again := e.migrate(t); again.ID != def.ID {
		t.Fatalf("second migration created another default branch")
	}
	if n := must(e.db.Collection("branches").CountDocuments(e.ctx, bson.M{})); n != 1 {
		t.Fatalf("branches = %d, want 1", n)
	}
	if !def.IsDefault || !def.IsActive || def.Slug != "ardabil" || def.Theme != service.DefaultTheme {
		t.Fatalf("unexpected default branch %+v", def)
	}
	for _, col := range []*mongo.Collection{cats, items} {
		if n := must(col.CountDocuments(e.ctx, bson.M{"branch_id": bson.M{"$ne": def.ID}})); n != 0 {
			t.Fatalf("%s: %d documents not assigned to the default branch", col.Name(), n)
		}
	}

	sections := must(e.menu.PublicMenu(e.ctx, def.ID))
	var got []string
	for _, s := range sections {
		for _, it := range s.Items {
			got = append(got, s.Category+"/"+it.Name)
		}
	}
	want := []string{"burgers/کلاسیک", "burgers/چیز", "drinks/کولا"}
	if !slices.Equal(got, want) {
		t.Fatalf("public menu = %v, want %v", got, want)
	}

	// The legacy unique slug index is gone: a second branch can have "burgers".
	tehran := must(e.branches.Create(e.ctx, models.BranchInput{Slug: ptr("tehran"), Name: ptr("تهران")}))
	must(e.cats.Create(e.ctx, tehran.ID, models.CategoryInput{Slug: ptr("burgers"), Title: ptr("برگر")}))
	if _, err := e.cats.Create(e.ctx, tehran.ID, models.CategoryInput{Slug: ptr("burgers"), Title: ptr("x")}); !isValidation(err) {
		t.Fatalf("duplicate slug in one branch: err = %v, want validation error", err)
	}
}

// TestCopiedBranchHasIndependentPrices covers opening a new location from an
// existing menu, then changing its prices.
func TestCopiedBranchHasIndependentPrices(t *testing.T) {
	e := newEnv(t)
	def := e.migrate(t)
	if err := e.cats.SeedIfEmpty(e.ctx, def.ID, seeder.DefaultCategories()); err != nil {
		t.Fatal(err)
	}
	classic := must(e.menu.Create(e.ctx, def.ID, models.MenuItemInput{
		Name: ptr("کلاسیک"), Price: ptr("۵۹۰"), Category: ptr("burgers"), ImageURL: ptr("https://img.test/classic.jpg"),
	}))
	must(e.menu.Create(e.ctx, def.ID, models.MenuItemInput{
		Name: ptr("کولا"), Price: ptr("۸۵"), Category: ptr("drinks"), ImageURL: ptr("https://img.test/cola.jpg"),
	}))

	tehran := must(e.branches.Create(e.ctx, models.BranchInput{
		Slug: ptr("tehran"), Name: ptr("تهران"), Theme: ptr("paper"), CopyFrom: ptr(def.ID.Hex()),
	}))
	tItems := must(e.menu.List(e.ctx, tehran.ID))
	if len(tItems) != 2 || len(must(e.cats.List(e.ctx, tehran.ID))) != len(seeder.DefaultCategories()) {
		t.Fatalf("copy: %d items, want 2 (and every category)", len(tItems))
	}
	var tClassic models.MenuItem
	for _, it := range tItems {
		if it.Name == "کلاسیک" {
			tClassic = it
		}
	}
	if tClassic.ID == classic.ID || tClassic.BranchID != tehran.ID {
		t.Fatalf("copied item must be a new document of the new branch: %+v", tClassic)
	}

	must(e.menu.Update(e.ctx, tClassic.ID.Hex(), models.MenuItemInput{Price: ptr("۷۹۰")}))
	if p := must(e.menu.Get(e.ctx, classic.ID.Hex())).Price; p != "۵۹۰" {
		t.Fatalf("editing the Tehran price changed Ardabil's to %s", p)
	}

	// The photo is shared: deleting one copy must keep it in storage.
	if err := e.menu.Delete(e.ctx, tClassic.ID.Hex()); err != nil {
		t.Fatal(err)
	}
	if len(e.images.deleted) != 0 {
		t.Fatalf("deleted a photo still used by Ardabil: %v", e.images.deleted)
	}
	if err := e.menu.Delete(e.ctx, classic.ID.Hex()); err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(e.images.deleted, []string{"https://img.test/classic.jpg"}) {
		t.Fatalf("deleted = %v, want the now unused classic photo", e.images.deleted)
	}
}

func TestBranchRules(t *testing.T) {
	e := newEnv(t)
	def := e.migrate(t)
	if err := e.cats.SeedIfEmpty(e.ctx, def.ID, seeder.DefaultCategories()); err != nil {
		t.Fatal(err)
	}

	if err := e.branches.Delete(e.ctx, def.ID.Hex()); !errors.Is(err, service.ErrDefaultBranch) {
		t.Fatalf("delete default: err = %v", err)
	}
	if _, err := e.branches.Update(e.ctx, def.ID.Hex(), models.BranchInput{IsActive: ptr(false)}); !isValidation(err) {
		t.Fatalf("deactivate default: err = %v", err)
	}
	for _, slug := range []string{"admin", "api", "default", "Tehran", "a", "x_y"} {
		if _, err := e.branches.Create(e.ctx, models.BranchInput{Slug: ptr(slug), Name: ptr("x")}); !isValidation(err) {
			t.Fatalf("slug %q: err = %v, want validation error", slug, err)
		}
	}
	if _, err := e.branches.Create(e.ctx, models.BranchInput{Slug: ptr("ardabil"), Name: ptr("x")}); !isValidation(err) {
		t.Fatalf("duplicate slug: err = %v", err)
	}

	if got := must(e.branches.Public(e.ctx, "default")); got.ID != def.ID {
		t.Fatalf("Public(default) = %s", got.Slug)
	}
	tehran := must(e.branches.Create(e.ctx, models.BranchInput{
		Slug: ptr("tehran"), Name: ptr("تهران"), IsActive: ptr(false), Instagram: ptr("@bergeerd.tehran"),
	}))
	if tehran.Instagram != "bergeerd.tehran" {
		t.Fatalf("instagram = %q, want the handle without @", tehran.Instagram)
	}
	if _, err := e.branches.Public(e.ctx, "tehran"); !errors.Is(err, service.ErrNotFound) {
		t.Fatalf("inactive branch must be hidden: err = %v", err)
	}
	must(e.branches.Update(e.ctx, tehran.ID.Hex(), models.BranchInput{IsActive: ptr(true)}))
	must(e.branches.Public(e.ctx, "TEHRAN"))

	// Categories are per branch: Tehran has none yet.
	_, err := e.menu.Create(e.ctx, tehran.ID, models.MenuItemInput{Name: ptr("x"), Price: ptr("۱"), Category: ptr("burgers")})
	if !isValidation(err) {
		t.Fatalf("item in a category of another branch: err = %v", err)
	}
	must(e.cats.Create(e.ctx, tehran.ID, models.CategoryInput{Slug: ptr("burgers"), Title: ptr("برگر")}))
	must(e.menu.Create(e.ctx, tehran.ID, models.MenuItemInput{
		Name: ptr("x"), Price: ptr("۱"), Category: ptr("burgers"), ImageURL: ptr("https://img.test/only-tehran.jpg"),
	}))
	if n := len(must(e.menu.PublicMenu(e.ctx, def.ID))); n != 0 {
		t.Fatalf("Ardabil shows %d sections of Tehran's menu", n)
	}

	if err := e.branches.Delete(e.ctx, tehran.ID.Hex()); err != nil {
		t.Fatal(err)
	}
	if n := len(must(e.cats.List(e.ctx, tehran.ID))); n != 0 {
		t.Fatalf("%d categories left after deleting the branch", n)
	}
	if !slices.Equal(e.images.deleted, []string{"https://img.test/only-tehran.jpg"}) {
		t.Fatalf("deleted = %v", e.images.deleted)
	}
}
