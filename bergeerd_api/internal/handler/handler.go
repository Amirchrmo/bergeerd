// Package handler maps HTTP requests to the service layer.
package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"bergeerd-api/internal/httputil"
	"bergeerd-api/internal/service"
)

// fail writes a service error; what names the resource for 404 messages.
func fail(c *gin.Context, err error, what string) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		httputil.Error(c, httputil.NewAPIError(http.StatusNotFound, what+" not found"))
	case errors.Is(err, service.ErrInvalidImage):
		httputil.Error(c, httputil.NewAPIError(http.StatusBadRequest, err.Error()))
	case errors.Is(err, service.ErrDefaultBranch):
		httputil.Error(c, httputil.NewAPIError(http.StatusConflict, err.Error()))
	default:
		httputil.Error(c, err) // validation errors and unknown errors
	}
}

// bind decodes the JSON body into dst, answering 400 when it is malformed.
func bind(c *gin.Context, dst any) bool {
	if err := c.ShouldBindJSON(dst); err != nil {
		httputil.Error(c, httputil.NewAPIError(http.StatusBadRequest, "invalid JSON body"))
		return false
	}
	return true
}

func deleted(c *gin.Context) {
	httputil.OK(c, gin.H{"deleted": true})
}

func str(p *string) string {
	if p == nil {
		return ""
	}
	return strings.TrimSpace(*p)
}
