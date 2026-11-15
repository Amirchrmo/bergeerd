package handler

import (
	"github.com/gin-gonic/gin"

	"bergeerd-api/internal/httputil"
	"bergeerd-api/internal/models"
	"bergeerd-api/internal/service"
)

// BranchHandler exposes branch management for the admin panel.
type BranchHandler struct {
	branches *service.BranchService
}

// NewBranchHandler creates a BranchHandler.
func NewBranchHandler(branches *service.BranchService) *BranchHandler {
	return &BranchHandler{branches: branches}
}

// List handles GET /api/admin/branches.
func (h *BranchHandler) List(c *gin.Context) {
	list, err := h.branches.List(c.Request.Context())
	if err != nil {
		fail(c, err, "branch")
		return
	}
	httputil.OK(c, list)
}

// Get handles GET /api/admin/branches/:id.
func (h *BranchHandler) Get(c *gin.Context) {
	b, err := h.branches.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	httputil.OK(c, b)
}

// Create handles POST /api/admin/branches (optional copy_from in the body).
func (h *BranchHandler) Create(c *gin.Context) {
	var in models.BranchInput
	if !bind(c, &in) {
		return
	}
	b, err := h.branches.Create(c.Request.Context(), in)
	if err != nil {
		fail(c, err, "branch")
		return
	}
	httputil.Created(c, b)
}

// Update handles PUT /api/admin/branches/:id.
func (h *BranchHandler) Update(c *gin.Context) {
	var in models.BranchInput
	if !bind(c, &in) {
		return
	}
	b, err := h.branches.Update(c.Request.Context(), c.Param("id"), in)
	if err != nil {
		fail(c, err, "branch")
		return
	}
	httputil.OK(c, b)
}

// Delete handles DELETE /api/admin/branches/:id.
func (h *BranchHandler) Delete(c *gin.Context) {
	if err := h.branches.Delete(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err, "branch")
		return
	}
	deleted(c)
}
