package service

import (
	"context"
	"log"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"bergeerd-api/internal/models"
	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/validation"
)

// DefaultTheme is the website design a branch gets when none is chosen: the
// original dark design served at bergeerd.ir.
const DefaultTheme = "ember"

// BranchService manages branches; deleting or copying a branch also touches
// its categories and menu items.
type BranchService struct {
	repo *repository.BranchRepo
	cats *CategoryService
	menu *MenuService
}

// NewBranchService wires the service with its dependencies.
func NewBranchService(repo *repository.BranchRepo, cats *CategoryService, menu *MenuService) *BranchService {
	return &BranchService{repo: repo, cats: cats, menu: menu}
}

var errDuplicateBranch = validation.NewFieldError("slug", "a branch with this address already exists")

// List returns every branch, default first.
func (s *BranchService) List(ctx context.Context) ([]models.Branch, error) {
	return s.repo.List(ctx)
}

// Get returns a branch by id.
func (s *BranchService) Get(ctx context.Context, id string) (models.Branch, error) {
	b, err := s.repo.Get(ctx, id)
	return b, notFound(err)
}

// Default returns the branch served at the site root.
func (s *BranchService) Default(ctx context.Context) (models.Branch, error) {
	b, err := s.repo.FindDefault(ctx)
	return b, notFound(err)
}

// Resolve returns the branch an admin request is about: the branch with the
// given id, or the default branch when id is empty (requests from admin
// panels that predate branches).
func (s *BranchService) Resolve(ctx context.Context, id string) (models.Branch, error) {
	if id == "" {
		return s.Default(ctx)
	}
	return s.Get(ctx, id)
}

// Public returns the active branch for a website URL slug; "default" is the
// branch served at the site root.
func (s *BranchService) Public(ctx context.Context, slug string) (models.Branch, error) {
	slug = strings.ToLower(slug)
	if slug == "default" {
		return s.Default(ctx)
	}
	b, err := s.repo.FindBySlug(ctx, slug)
	if err == nil && !b.IsActive {
		return models.Branch{}, ErrNotFound
	}
	return b, notFound(err)
}

// Create validates and inserts a branch. With CopyFrom set, the categories
// and items of that branch are copied in, so a new location can start from an
// existing menu and only adjust its prices.
func (s *BranchService) Create(ctx context.Context, in models.BranchInput) (models.Branch, error) {
	if err := validation.ValidateBranchInput(in, true); err != nil {
		return models.Branch{}, err
	}
	var source *models.Branch
	if id := trimmed(in.CopyFrom); id != "" {
		src, err := s.Get(ctx, id)
		if err != nil {
			return models.Branch{}, validation.NewFieldError("copy_from", "unknown branch")
		}
		source = &src
	}

	b := models.Branch{
		Slug:        trimmed(in.Slug),
		Name:        trimmed(in.Name),
		Theme:       themeOr(in.Theme),
		IsActive:    boolOr(in.IsActive, true),
		Order:       intOr(in.Order, 0),
		Address:     trimmed(in.Address),
		Phone:       trimmed(in.Phone),
		Hours:       trimmed(in.Hours),
		MapURL:      trimmed(in.MapURL),
		MapEmbedURL: trimmed(in.MapEmbedURL),
		Instagram:   instagram(in.Instagram),
	}
	if err := s.repo.Create(ctx, &b); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return models.Branch{}, errDuplicateBranch
		}
		return models.Branch{}, err
	}

	if source != nil {
		err := s.cats.copyBranch(ctx, source.ID, b.ID)
		if err == nil {
			err = s.menu.copyBranch(ctx, source.ID, b.ID)
		}
		if err != nil {
			// Don't leave a half-copied branch behind.
			if derr := s.remove(ctx, b); derr != nil {
				log.Printf("clean up branch %s after failed copy: %v", b.Slug, derr)
			}
			return models.Branch{}, err
		}
	}
	return b, nil
}

// Update applies a partial update. The default branch cannot be deactivated:
// it is what the site root and the printed QR codes show.
func (s *BranchService) Update(ctx context.Context, id string, in models.BranchInput) (models.Branch, error) {
	if err := validation.ValidateBranchInput(in, false); err != nil {
		return models.Branch{}, err
	}
	existing, err := s.Get(ctx, id)
	if err != nil {
		return models.Branch{}, err
	}
	if existing.IsDefault && in.IsActive != nil && !*in.IsActive {
		return models.Branch{}, validation.NewFieldError("is_active", "the default branch must stay active")
	}

	set := bson.M{}
	for field, p := range map[string]*string{
		"slug": in.Slug, "name": in.Name, "address": in.Address, "phone": in.Phone,
		"hours": in.Hours, "map_url": in.MapURL, "map_embed_url": in.MapEmbedURL,
	} {
		if p != nil {
			set[field] = trimmed(p)
		}
	}
	if in.Theme != nil {
		set["theme"] = themeOr(in.Theme)
	}
	if in.Instagram != nil {
		set["instagram"] = instagram(in.Instagram)
	}
	if in.IsActive != nil {
		set["is_active"] = *in.IsActive
	}
	if in.Order != nil {
		set["order"] = *in.Order
	}
	if err := s.repo.Update(ctx, id, set); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return models.Branch{}, errDuplicateBranch
		}
		return models.Branch{}, notFound(err)
	}
	return s.Get(ctx, id)
}

// Delete removes a branch together with its categories, items and the photos
// only it used. The default branch cannot be deleted.
func (s *BranchService) Delete(ctx context.Context, id string) error {
	b, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	if b.IsDefault {
		return ErrDefaultBranch
	}
	return s.remove(ctx, b)
}

func (s *BranchService) remove(ctx context.Context, b models.Branch) error {
	if err := s.menu.deleteBranch(ctx, b.ID); err != nil {
		return err
	}
	if err := s.cats.deleteBranch(ctx, b.ID); err != nil {
		return err
	}
	return notFound(s.repo.Delete(ctx, b.ID.Hex()))
}

func themeOr(p *string) string {
	if t := trimmed(p); t != "" {
		return t
	}
	return DefaultTheme
}

func instagram(p *string) string {
	return strings.TrimPrefix(trimmed(p), "@")
}
