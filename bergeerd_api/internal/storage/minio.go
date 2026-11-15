package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioStorage wraps a MinIO client and the bucket used for menu images.
type MinioStorage struct {
	client    *minio.Client
	bucket    string
	publicURL string
}

// NewMinio creates a MinIO client and ensures the configured bucket exists.
func NewMinio(endpoint, accessKey, secretKey, bucket, publicURL string, useSSL bool) (*MinioStorage, error) {
	cli, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio init: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	exists, err := cli.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("minio bucket check: %w", err)
	}
	if !exists {
		if err := cli.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio make bucket: %w", err)
		}
		// Allow anonymous reads so the website can load images without credentials.
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{"Effect": "Allow", "Principal": {"AWS": ["*"]}, "Action": ["s3:GetObject"], "Resource": ["arn:aws:s3:::%s/*"]}
			]
		}`, bucket)
		if err := cli.SetBucketPolicy(ctx, bucket, policy); err != nil {
			return nil, fmt.Errorf("minio set bucket policy: %w", err)
		}
	}

	return &MinioStorage{
		client:    cli,
		bucket:    bucket,
		publicURL: strings.TrimRight(publicURL, "/"),
	}, nil
}

// UploadResult describes a freshly stored object.
type UploadResult struct {
	URL      string // fully qualified public URL
	Object   string // object key within the bucket
	Size     int64
	MimeType string
}

// UploadImage stores an image under a unique key and returns its public URL.
// The reader must be positioned at the start of the file content; size is the
// total number of bytes (required by MinIO for non-chunked uploads).
func (s *MinioStorage) UploadImage(ctx context.Context, r io.Reader, size int64, originalName, contentType string) (UploadResult, error) {
	ext := strings.ToLower(filepath.Ext(originalName))
	if ext == "" {
		ext = ".jpg"
	}
	object := fmt.Sprintf("menu/%s%s", uuid.NewString(), ext)

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err := s.client.PutObject(ctx, s.bucket, object, r, size,
		minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return UploadResult{}, fmt.Errorf("minio put object: %w", err)
	}

	return UploadResult{
		URL:      s.publicURLFor(object),
		Object:   object,
		Size:     size,
		MimeType: contentType,
	}, nil
}

// DeleteByURL removes the object behind a public URL produced by UploadImage.
// URLs that do not point into our bucket (e.g. a pasted external link) are
// ignored, as are objects that are already gone.
func (s *MinioStorage) DeleteByURL(ctx context.Context, rawURL string) error {
	prefix := s.publicURL + "/" + s.bucket + "/"
	object, ok := strings.CutPrefix(rawURL, prefix)
	if !ok || object == "" {
		return nil
	}
	err := s.client.RemoveObject(ctx, s.bucket, object, minio.RemoveObjectOptions{})
	if err != nil && minio.ToErrorResponse(err).Code != "NoSuchKey" {
		return fmt.Errorf("minio remove object: %w", err)
	}
	return nil
}

// publicURLFor builds the public URL for an object key.
func (s *MinioStorage) publicURLFor(object string) string {
	return fmt.Sprintf("%s/%s/%s", s.publicURL, s.bucket, object)
}
