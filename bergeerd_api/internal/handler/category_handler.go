package handler

import (
	"github.com/gin-gonic/gin"

	"bergeerd-api/internal/httputil"
	"bergeerd-api/internal/models"
	"bergeerd-api/internal/service"
)

// CategoryHandler exposes category management for the admin panel.
type CategoryHandler struct {
	cats     *service.CategoryService
	branches *service.BranchService
}

// NewCategoryHandler creates a CategoryHandler.
func NewCategoryHandler(cats *service.CategoryService, branches *service.BranchService) *CategoryHandler {
	return &CategoryHandler{cats: cats, branches: branches}
}

// List handles GET /api/admin/categories?branch_id= (default branch if omitted).
func (h *CategoryHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	b, err := h.branches.Resolve(ctx, c.Query("branch_id"))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	cats, err := h.cats.List(ctx, b.ID)
	if err != nil {
		fail(c, err, "category")
		return
	}
	httputil.OK(c, cats)
}

// Get handles GET /api/admin/categories/:id.
func (h *CategoryHandler) Get(c *gin.Context) {
	cat, err := h.cats.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err, "category")
		return
	}
	httputil.OK(c, cat)
}

// Create handles POST /api/admin/categories (branch_id in the body, default
// branch if omitted).
func (h *CategoryHandler) Create(c *gin.Context) {
	var in models.CategoryInput
	if !bind(c, &in) {
		return
	}
	ctx := c.Request.Context()
	b, err := h.branches.Resolve(ctx, str(in.BranchID))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	cat, err := h.cats.Create(ctx, b.ID, in)
	if err != nil {
		fail(c, err, "category")
		return
	}
	httputil.Created(c, cat)
}

// Update handles PUT /api/admin/categories/:id.
func (h *CategoryHandler) Update(c *gin.Context) {
	var in models.CategoryInput
	if !bind(c, &in) {
		return
	}
	cat, err := h.cats.Update(c.Request.Context(), c.Param("id"), in)
	if err != nil {
		fail(c, err, "category")
		return
	}
	httputil.OK(c, cat)
}

// Delete handles DELETE /api/admin/categories/:id.
func (h *CategoryHandler) Delete(c *gin.Context) {
	if err := h.cats.Delete(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err, "category")
		return
	}
	deleted(c)
}
