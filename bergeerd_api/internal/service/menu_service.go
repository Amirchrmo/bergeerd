package service

import (
	"context"
	"io"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"bergeerd-api/internal/models"
	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/storage"
	"bergeerd-api/internal/validation"
)

// MenuService manages menu items and their photos.
type MenuService struct {
	repo   *repository.MenuItemRepo
	images ImageStore
	cats   *CategoryService
}

// NewMenuService wires the service with its dependencies.
func NewMenuService(repo *repository.MenuItemRepo, images ImageStore, cats *CategoryService) *MenuService {
	return &MenuService{repo: repo, images: images, cats: cats}
}

// List returns every item of a branch, including inactive ones (admin view).
func (s *MenuService) List(ctx context.Context, branchID primitive.ObjectID) ([]models.MenuItem, error) {
	return s.repo.List(ctx, branchID)
}

// PublicMenu returns a branch's visible menu: active categories in order,
// each with its active items in order. Empty categories are left out.
func (s *MenuService) PublicMenu(ctx context.Context, branchID primitive.ObjectID) ([]models.MenuSection, error) {
	cats, err := s.cats.List(ctx, branchID)
	if err != nil {
		return nil, err
	}
	items, err := s.repo.ListActive(ctx, branchID)
	if err != nil {
		return nil, err
	}
	byCategory := map[string][]models.MenuItem{}
	for _, it := range items {
		byCategory[it.Category] = append(byCategory[it.Category], it)
	}
	sections := []models.MenuSection{}
	for _, c := range cats {
		if !c.IsActive || len(byCategory[c.Slug]) == 0 {
			continue
		}
		title := c.Title
		if title == "" {
			title = c.Slug
		}
		sections = append(sections, models.MenuSection{
			Category: c.Slug, Title: title, Order: c.Order, Items: byCategory[c.Slug],
		})
	}
	return sections, nil
}

// Get returns a single item by id.
func (s *MenuService) Get(ctx context.Context, id string) (models.MenuItem, error) {
	item, err := s.repo.Get(ctx, id)
	return item, notFound(err)
}

// Create validates and inserts a new item in a branch.
func (s *MenuService) Create(ctx context.Context, branchID primitive.ObjectID, in models.MenuItemInput) (models.MenuItem, error) {
	if err := validation.ValidateMenuItemInput(in, true); err != nil {
		return models.MenuItem{}, err
	}
	if err := s.checkCategory(ctx, branchID, trimmed(in.Category)); err != nil {
		return models.MenuItem{}, err
	}
	item := models.MenuItem{
		BranchID:    branchID,
		Name:        trimmed(in.Name),
		Description: trimmed(in.Description),
		Price:       trimmed(in.Price),
		ImageURL:    trimmed(in.ImageURL),
		ImageAlt:    trimmed(in.ImageAlt),
		Category:    trimmed(in.Category),
		Order:       intOr(in.Order, 0),
		IsActive:    boolOr(in.IsActive, true),
	}
	if err := s.repo.Create(ctx, &item); err != nil {
		return models.MenuItem{}, err
	}
	return item, nil
}

// Update applies a partial update. The item stays in its branch; a replaced
// photo is deleted from storage once no other item uses it.
func (s *MenuService) Update(ctx context.Context, id string, in models.MenuItemInput) (models.MenuItem, error) {
	if err := validation.ValidateMenuItemInput(in, false); err != nil {
		return models.MenuItem{}, err
	}
	existing, err := s.Get(ctx, id)
	if err != nil {
		return models.MenuItem{}, err
	}
	if in.Category != nil {
		if err := s.checkCategory(ctx, existing.BranchID, trimmed(in.Category)); err != nil {
			return models.MenuItem{}, err
		}
	}

	set := bson.M{}
	for field, p := range map[string]*string{
		"name": in.Name, "description": in.Description, "price": in.Price,
		"image_url": in.ImageURL, "image_alt": in.ImageAlt, "category": in.Category,
	} {
		if p != nil {
			set[field] = trimmed(p)
		}
	}
	if in.Order != nil {
		set["order"] = *in.Order
	}
	if in.IsActive != nil {
		set["is_active"] = *in.IsActive
	}
	if err := s.repo.Update(ctx, id, set); err != nil {
		return models.MenuItem{}, notFound(err)
	}
	if in.ImageURL != nil && trimmed(in.ImageURL) != existing.ImageURL {
		s.releaseImage(ctx, existing.ImageURL)
	}
	return s.Get(ctx, id)
}

// Delete removes an item, and its photo once no other item uses it.
func (s *MenuService) Delete(ctx context.Context, id string) error {
	item, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return notFound(err)
	}
	s.releaseImage(ctx, item.ImageURL)
	return nil
}

// UploadImage stores an image and returns its public URL.
func (s *MenuService) UploadImage(ctx context.Context, r io.Reader, size int64, name, contentType string) (storage.UploadResult, error) {
	if size <= 0 {
		return storage.UploadResult{}, ErrInvalidImage
	}
	return s.images.UploadImage(ctx, r, size, name, contentType)
}

// Count returns the number of items in a branch.
func (s *MenuService) Count(ctx context.Context, branchID primitive.ObjectID) (int64, error) {
	return s.repo.Count(ctx, branchID)
}

// Seed inserts the given items into a branch (used on first run).
func (s *MenuService) Seed(ctx context.Context, branchID primitive.ObjectID, items []models.MenuItem) error {
	for i := range items {
		items[i].BranchID = branchID
	}
	return s.repo.InsertMany(ctx, items)
}

// copyBranch copies every item of one branch into another. The copies share
// the photos of the originals; releaseImage keeps shared photos alive.
func (s *MenuService) copyBranch(ctx context.Context, from, to primitive.ObjectID) error {
	items, err := s.repo.List(ctx, from)
	if err != nil {
		return err
	}
	// Fresh ids are generated in list order, so equal-order items keep their
	// relative order in the copy.
	for i := range items {
		items[i].ID = primitive.NilObjectID
		items[i].BranchID = to
		items[i].CreatedAt = time.Time{}
	}
	return s.repo.InsertMany(ctx, items)
}

// deleteBranch removes every item of a branch and the photos only it used.
func (s *MenuService) deleteBranch(ctx context.Context, branchID primitive.ObjectID) error {
	items, err := s.repo.List(ctx, branchID)
	if err != nil {
		return err
	}
	if err := s.repo.DeleteByBranch(ctx, branchID); err != nil {
		return err
	}
	for _, it := range items {
		s.releaseImage(ctx, it.ImageURL)
	}
	return nil
}

// checkCategory rejects category slugs that do not exist in the branch.
func (s *MenuService) checkCategory(ctx context.Context, branchID primitive.ObjectID, slug string) error {
	ok, err := s.cats.Exists(ctx, branchID, slug)
	if err != nil {
		return err
	}
	if !ok {
		return validation.NewFieldError("category", "unknown category; create it first in the Categories page")
	}
	return nil
}

// releaseImage deletes a photo from storage when no item references it any
// more. Failures are logged, never returned: the database change succeeded
// and an orphaned object is harmless.
func (s *MenuService) releaseImage(ctx context.Context, url string) {
	if url == "" {
		return
	}
	n, err := s.repo.CountWithImage(ctx, url)
	if err == nil && n == 0 {
		err = s.images.DeleteByURL(ctx, url)
	}
	if err != nil {
		log.Printf("release image %s: %v", url, err)
	}
}
