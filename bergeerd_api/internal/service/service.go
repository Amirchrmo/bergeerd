// Package service holds the business rules: branch scoping, validation, menu
// grouping, branch copying and image lifecycle.
package service

import (
	"context"
	"errors"
	"io"
	"strings"

	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/storage"
)

// Errors returned by the service layer.
var (
	ErrNotFound      = errors.New("not found")
	ErrInvalidImage  = errors.New("invalid image file")
	ErrDefaultBranch = errors.New("the default branch cannot be deleted")
)

// ImageStore keeps menu photos (MinIO in production).
type ImageStore interface {
	UploadImage(ctx context.Context, r io.Reader, size int64, name, contentType string) (storage.UploadResult, error)
	DeleteByURL(ctx context.Context, url string) error
}

// notFound maps the repository's not-found error to the service's.
func notFound(err error) error {
	if errors.Is(err, repository.ErrNotFound) {
		return ErrNotFound
	}
	return err
}

func trimmed(p *string) string {
	if p == nil {
		return ""
	}
	return strings.TrimSpace(*p)
}

func boolOr(p *bool, def bool) bool {
	if p == nil {
		return def
	}
	return *p
}

func intOr(p *int, def int) int {
	if p == nil {
		return def
	}
	return *p
}
