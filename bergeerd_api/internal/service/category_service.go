package service

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"bergeerd-api/internal/models"
	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/validation"
)

// CategoryService manages a branch's menu categories.
type CategoryService struct {
	repo *repository.CategoryRepo
}

// NewCategoryService wires the service with its repository.
func NewCategoryService(repo *repository.CategoryRepo) *CategoryService {
	return &CategoryService{repo: repo}
}

var errDuplicateCategory = validation.NewFieldError("slug", "a category with this slug already exists in this branch")

// List returns a branch's categories in display order.
func (s *CategoryService) List(ctx context.Context, branchID primitive.ObjectID) ([]models.Category, error) {
	return s.repo.List(ctx, branchID)
}

// Get returns a single category by id.
func (s *CategoryService) Get(ctx context.Context, id string) (models.Category, error) {
	cat, err := s.repo.Get(ctx, id)
	return cat, notFound(err)
}

// Exists reports whether the branch has a category with this slug.
func (s *CategoryService) Exists(ctx context.Context, branchID primitive.ObjectID, slug string) (bool, error) {
	_, err := s.repo.FindBySlug(ctx, branchID, slug)
	if errors.Is(err, repository.ErrNotFound) {
		return false, nil
	}
	return err == nil, err
}

// Create validates and inserts a new category in a branch.
func (s *CategoryService) Create(ctx context.Context, branchID primitive.ObjectID, in models.CategoryInput) (models.Category, error) {
	if err := validation.ValidateCategoryInput(in, true); err != nil {
		return models.Category{}, err
	}
	cat := models.Category{
		BranchID: branchID,
		Slug:     trimmed(in.Slug),
		Title:    trimmed(in.Title),
		Order:    intOr(in.Order, 0),
		IsActive: boolOr(in.IsActive, true),
	}
	if err := s.repo.Create(ctx, &cat); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return models.Category{}, errDuplicateCategory
		}
		return models.Category{}, err
	}
	return cat, nil
}

// Update applies a partial update to a category. Menu items reference
// categories by slug, so renaming a slug detaches its items (the admin panel
// warns about this).
func (s *CategoryService) Update(ctx context.Context, id string, in models.CategoryInput) (models.Category, error) {
	if err := validation.ValidateCategoryInput(in, false); err != nil {
		return models.Category{}, err
	}
	set := bson.M{}
	if in.Slug != nil {
		set["slug"] = trimmed(in.Slug)
	}
	if in.Title != nil {
		set["title"] = trimmed(in.Title)
	}
	if in.Order != nil {
		set["order"] = *in.Order
	}
	if in.IsActive != nil {
		set["is_active"] = *in.IsActive
	}
	if err := s.repo.Update(ctx, id, set); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return models.Category{}, errDuplicateCategory
		}
		return models.Category{}, notFound(err)
	}
	return s.Get(ctx, id)
}

// Delete removes a category. Its items stay in the database but are no
// longer shown until they are moved to another category.
func (s *CategoryService) Delete(ctx context.Context, id string) error {
	return notFound(s.repo.Delete(ctx, id))
}

// SeedIfEmpty inserts the given categories when the branch has none.
func (s *CategoryService) SeedIfEmpty(ctx context.Context, branchID primitive.ObjectID, cats []models.Category) error {
	n, err := s.repo.Count(ctx, branchID)
	if err != nil || n > 0 {
		return err
	}
	return s.repo.InsertMany(ctx, withBranch(cats, branchID))
}

// copyBranch copies every category of one branch into another.
func (s *CategoryService) copyBranch(ctx context.Context, from, to primitive.ObjectID) error {
	cats, err := s.repo.List(ctx, from)
	if err != nil {
		return err
	}
	return s.repo.InsertMany(ctx, withBranch(cats, to))
}

// deleteBranch removes every category of a branch.
func (s *CategoryService) deleteBranch(ctx context.Context, branchID primitive.ObjectID) error {
	return s.repo.DeleteByBranch(ctx, branchID)
}

// withBranch returns fresh copies of cats that belong to branchID.
func withBranch(cats []models.Category, branchID primitive.ObjectID) []models.Category {
	out := make([]models.Category, len(cats))
	for i, c := range cats {
		out[i] = models.Category{
			BranchID: branchID, Slug: c.Slug, Title: c.Title, Order: c.Order, IsActive: c.IsActive,
		}
	}
	return out
}
