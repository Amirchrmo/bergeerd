package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"bergeerd-api/internal/httputil"
	"bergeerd-api/internal/models"
	"bergeerd-api/internal/service"
)

// MenuHandler exposes the public menus and menu item management.
type MenuHandler struct {
	menu     *service.MenuService
	branches *service.BranchService
}

// NewMenuHandler creates a MenuHandler.
func NewMenuHandler(menu *service.MenuService, branches *service.BranchService) *MenuHandler {
	return &MenuHandler{menu: menu, branches: branches}
}

// maxImageSize limits single image uploads to 10 MB.
const maxImageSize = 10 << 20

// DefaultMenu handles GET /api/menu: the default branch's sections, in the
// response shape the website has always used.
func (h *MenuHandler) DefaultMenu(c *gin.Context) {
	ctx := c.Request.Context()
	b, err := h.branches.Default(ctx)
	if err != nil {
		fail(c, err, "branch")
		return
	}
	sections, err := h.menu.PublicMenu(ctx, b.ID)
	if err != nil {
		fail(c, err, "menu")
		return
	}
	httputil.OK(c, sections)
}

// BranchMenu handles GET /api/branches/:slug/menu: one branch's details and
// menu ("default" = the branch at the site root).
func (h *MenuHandler) BranchMenu(c *gin.Context) {
	ctx := c.Request.Context()
	b, err := h.branches.Public(ctx, c.Param("slug"))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	sections, err := h.menu.PublicMenu(ctx, b.ID)
	if err != nil {
		fail(c, err, "menu")
		return
	}
	httputil.OK(c, models.BranchMenu{Branch: b.Public(), Sections: sections})
}

// List handles GET /api/admin/menu?branch_id= (default branch if omitted).
func (h *MenuHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	b, err := h.branches.Resolve(ctx, c.Query("branch_id"))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	items, err := h.menu.List(ctx, b.ID)
	if err != nil {
		fail(c, err, "menu item")
		return
	}
	httputil.OK(c, items)
}

// Get handles GET /api/admin/menu/:id.
func (h *MenuHandler) Get(c *gin.Context) {
	item, err := h.menu.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err, "menu item")
		return
	}
	httputil.OK(c, item)
}

// Create handles POST /api/admin/menu (branch_id in the body, default branch
// if omitted).
func (h *MenuHandler) Create(c *gin.Context) {
	var in models.MenuItemInput
	if !bind(c, &in) {
		return
	}
	ctx := c.Request.Context()
	b, err := h.branches.Resolve(ctx, str(in.BranchID))
	if err != nil {
		fail(c, err, "branch")
		return
	}
	item, err := h.menu.Create(ctx, b.ID, in)
	if err != nil {
		fail(c, err, "menu item")
		return
	}
	httputil.Created(c, item)
}

// Update handles PUT /api/admin/menu/:id.
func (h *MenuHandler) Update(c *gin.Context) {
	var in models.MenuItemInput
	if !bind(c, &in) {
		return
	}
	item, err := h.menu.Update(c.Request.Context(), c.Param("id"), in)
	if err != nil {
		fail(c, err, "menu item")
		return
	}
	httputil.OK(c, item)
}

// Delete handles DELETE /api/admin/menu/:id.
func (h *MenuHandler) Delete(c *gin.Context) {
	if err := h.menu.Delete(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err, "menu item")
		return
	}
	deleted(c)
}

// UploadImage handles POST /api/admin/upload (multipart field "image") and
// returns the stored image's public URL.
func (h *MenuHandler) UploadImage(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxImageSize)

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		httputil.Error(c, httputil.NewAPIError(http.StatusBadRequest, "image file is required (field name 'image', max 10MB)"))
		return
	}
	defer file.Close()

	ct := header.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "image/") {
		httputil.Error(c, httputil.NewAPIError(http.StatusBadRequest, "file must be an image"))
		return
	}

	res, err := h.menu.UploadImage(c.Request.Context(), file, header.Size, header.Filename, ct)
	if err != nil {
		fail(c, err, "image")
		return
	}
	httputil.Created(c, gin.H{
		"url":       res.URL,
		"object":    res.Object,
		"size":      res.Size,
		"mime_type": res.MimeType,
	})
}
