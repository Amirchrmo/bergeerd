package validation

import (
	"errors"
	"regexp"
	"strings"
	"unicode/utf8"

	"bergeerd-api/internal/models"
)

// ErrValidation aggregates field validation errors.
type ErrValidation struct {
	Errors map[string]string
}

func (e *ErrValidation) Error() string {
	if len(e.Errors) == 0 {
		return "validation failed"
	}
	parts := make([]string, 0, len(e.Errors))
	for k, v := range e.Errors {
		parts = append(parts, k+": "+v)
	}
	return strings.Join(parts, "; ")
}

func (e *ErrValidation) add(field, msg string) {
	if e.Errors == nil {
		e.Errors = map[string]string{}
	}
	e.Errors[field] = msg
}

// result returns the aggregated error, or nil when nothing was recorded.
func (e *ErrValidation) result() error {
	if len(e.Errors) == 0 {
		return nil
	}
	return e
}

// required validates a field that must be sent on create and may never be
// blank; lengths are counted in characters, not bytes (Persian text).
func (e *ErrValidation) required(field string, p *string, max int, create bool) {
	if p == nil {
		if create {
			e.add(field, "is required")
		}
		return
	}
	if strings.TrimSpace(*p) == "" {
		e.add(field, "must not be empty")
		return
	}
	e.optional(field, p, max)
}

// optional validates the length of a field that may be blank.
func (e *ErrValidation) optional(field string, p *string, max int) {
	if p != nil && utf8.RuneCountInString(strings.TrimSpace(*p)) > max {
		e.add(field, "is too long")
	}
}

func (e *ErrValidation) order(p *int) {
	if p != nil && *p < 0 {
		e.add("order", "must be zero or positive")
	}
}

// AsValidationError returns the error as a *ErrValidation if it is one, else nil.
func AsValidationError(err error) *ErrValidation {
	var v *ErrValidation
	if errors.As(err, &v) {
		return v
	}
	return nil
}

// NewFieldError returns a single-field validation error.
func NewFieldError(field, msg string) *ErrValidation {
	return &ErrValidation{Errors: map[string]string{field: msg}}
}

var slugRe = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// isSlug reports whether s is a lowercase kebab-case slug, e.g. "burgers".
func isSlug(s string) bool { return slugRe.MatchString(s) }

// reservedBranchSlugs cannot be branch URLs: the server routes them elsewhere
// (/admin, /api, ...) or the website uses them ("default" = root branch).
var reservedBranchSlugs = map[string]bool{
	"admin": true, "api": true, "assets": true, "health": true,
	"bergeerd-minio": true, "default": true,
}

var instagramRe = regexp.MustCompile(`^[A-Za-z0-9._]{1,60}$`)

// ValidateBranchInput validates a branch payload; create requires slug and name.
func ValidateBranchInput(in models.BranchInput, create bool) error {
	v := &ErrValidation{}

	if in.Slug != nil || create {
		slug := ""
		if in.Slug != nil {
			slug = strings.TrimSpace(*in.Slug)
		}
		switch {
		case slug == "":
			v.add("slug", "is required")
		case len(slug) < 2 || len(slug) > 40 || !isSlug(slug):
			v.add("slug", "must be 2-40 lowercase letters, numbers and hyphens")
		case reservedBranchSlugs[slug]:
			v.add("slug", "this address is reserved by the website")
		}
	}
	v.required("name", in.Name, 80, create)
	if in.Theme != nil {
		if t := strings.TrimSpace(*in.Theme); t != "" && (!isSlug(t) || len(t) > 30) {
			v.add("theme", "must be a theme key such as ember or paper")
		}
	}
	v.order(in.Order)
	v.optional("address", in.Address, 200)
	v.optional("phone", in.Phone, 40)
	v.optional("hours", in.Hours, 120)
	for field, p := range map[string]*string{"map_url": in.MapURL, "map_embed_url": in.MapEmbedURL} {
		if p == nil {
			continue
		}
		u := strings.TrimSpace(*p)
		if u != "" && (!strings.HasPrefix(u, "https://") || len(u) > 1000) {
			v.add(field, "must be an https:// link")
		}
	}
	if in.Instagram != nil {
		if h := strings.TrimPrefix(strings.TrimSpace(*in.Instagram), "@"); h != "" && !instagramRe.MatchString(h) {
			v.add("instagram", "must be an Instagram username")
		}
	}
	return v.result()
}

// ValidateCategoryInput validates a category payload; create requires slug and title.
func ValidateCategoryInput(in models.CategoryInput, create bool) error {
	v := &ErrValidation{}
	if in.Slug != nil || create {
		slug := ""
		if in.Slug != nil {
			slug = strings.TrimSpace(*in.Slug)
		}
		switch {
		case slug == "":
			v.add("slug", "is required")
		case len(slug) > 60 || !isSlug(slug):
			v.add("slug", "must contain only lowercase letters, numbers, and hyphens")
		}
	}
	v.required("title", in.Title, 120, create)
	v.order(in.Order)
	return v.result()
}

// ValidateMenuItemInput validates a menu item payload; create requires name,
// price and category. Whether the category exists in the item's branch is
// checked by the service.
func ValidateMenuItemInput(in models.MenuItemInput, create bool) error {
	v := &ErrValidation{}
	v.required("name", in.Name, 120, create)
	v.optional("description", in.Description, 600)
	v.required("price", in.Price, 40, create)
	v.required("category", in.Category, 60, create)
	v.optional("image_alt", in.ImageAlt, 200)
	if in.ImageURL != nil {
		u := strings.TrimSpace(*in.ImageURL)
		if u == "" {
			v.add("image_url", "must not be empty when provided")
		} else if len(u) > 500 {
			v.add("image_url", "is too long")
		}
	}
	v.order(in.Order)
	return v.result()
}
