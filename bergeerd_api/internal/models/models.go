package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Branch is one restaurant location. Every branch owns its own categories and
// menu items (so names, photos and prices are independent) and is served at
// bergeerd.ir/<slug>. Exactly one branch is the default: it is also served at
// the site root, which is what the printed QR codes point to.
type Branch struct {
	ID          primitive.ObjectID `json:"id"            bson:"_id"`
	Slug        string             `json:"slug"          bson:"slug"`
	Name        string             `json:"name"          bson:"name"`
	Theme       string             `json:"theme"         bson:"theme"`
	IsDefault   bool               `json:"is_default"    bson:"is_default"`
	IsActive    bool               `json:"is_active"     bson:"is_active"`
	Order       int                `json:"order"         bson:"order"`
	Address     string             `json:"address"       bson:"address"`
	Phone       string             `json:"phone"         bson:"phone"`
	Hours       string             `json:"hours"         bson:"hours"`
	MapURL      string             `json:"map_url"       bson:"map_url"`
	MapEmbedURL string             `json:"map_embed_url" bson:"map_embed_url"`
	Instagram   string             `json:"instagram"     bson:"instagram"`
	CreatedAt   time.Time          `json:"created_at"    bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"    bson:"updated_at"`
}

// PublicBranch is the part of a branch the public website needs.
type PublicBranch struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Theme       string `json:"theme"`
	IsDefault   bool   `json:"is_default"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Hours       string `json:"hours"`
	MapURL      string `json:"map_url"`
	MapEmbedURL string `json:"map_embed_url"`
	Instagram   string `json:"instagram"`
}

// Public returns the website-facing view of the branch.
func (b Branch) Public() PublicBranch {
	return PublicBranch{
		Slug: b.Slug, Name: b.Name, Theme: b.Theme, IsDefault: b.IsDefault,
		Address: b.Address, Phone: b.Phone, Hours: b.Hours,
		MapURL: b.MapURL, MapEmbedURL: b.MapEmbedURL, Instagram: b.Instagram,
	}
}

// BranchInput is the payload for creating/updating a branch. Pointer fields
// distinguish "not provided" from "cleared".
type BranchInput struct {
	Slug        *string `json:"slug"`
	Name        *string `json:"name"`
	Theme       *string `json:"theme"`
	IsActive    *bool   `json:"is_active"`
	Order       *int    `json:"order"`
	Address     *string `json:"address"`
	Phone       *string `json:"phone"`
	Hours       *string `json:"hours"`
	MapURL      *string `json:"map_url"`
	MapEmbedURL *string `json:"map_embed_url"`
	Instagram   *string `json:"instagram"`
	// CopyFrom (create only) is the id of a branch whose categories and menu
	// items are copied into the new branch as a starting point.
	CopyFrom *string `json:"copy_from"`
}

// Category groups menu items within one branch, e.g. burgers or drinks.
// `slug` is the key menu items reference (unique per branch); `title` is the
// Persian section heading shown on the site.
type Category struct {
	ID        primitive.ObjectID `json:"id"         bson:"_id"`
	BranchID  primitive.ObjectID `json:"branch_id"  bson:"branch_id"`
	Slug      string             `json:"slug"       bson:"slug"`
	Title     string             `json:"title"      bson:"title"`
	Order     int                `json:"order"      bson:"order"`
	IsActive  bool               `json:"is_active"  bson:"is_active"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// CategoryInput is the payload for creating/updating a category. BranchID is
// only read on create; a category never moves between branches.
type CategoryInput struct {
	BranchID *string `json:"branch_id"`
	Slug     *string `json:"slug"`
	Title    *string `json:"title"`
	Order    *int    `json:"order"`
	IsActive *bool   `json:"is_active"`
}

// MenuItem is one dish or drink on a branch's menu.
type MenuItem struct {
	ID          primitive.ObjectID `json:"id"          bson:"_id"`
	BranchID    primitive.ObjectID `json:"branch_id"   bson:"branch_id"`
	Name        string             `json:"name"        bson:"name"`
	Description string             `json:"description" bson:"description"`
	Price       string             `json:"price"       bson:"price"`
	ImageURL    string             `json:"image_url"   bson:"image_url"`
	ImageAlt    string             `json:"image_alt"   bson:"image_alt"`
	Category    string             `json:"category"    bson:"category"`
	Order       int                `json:"order"       bson:"order"`
	IsActive    bool               `json:"is_active"   bson:"is_active"`
	CreatedAt   time.Time          `json:"created_at"  bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"  bson:"updated_at"`
}

// MenuItemInput is the payload for creating/updating a menu item. BranchID is
// only read on create; an item never moves between branches.
type MenuItemInput struct {
	BranchID    *string `json:"branch_id"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Price       *string `json:"price"`
	ImageURL    *string `json:"image_url"`
	ImageAlt    *string `json:"image_alt"`
	Category    *string `json:"category"`
	Order       *int    `json:"order"`
	IsActive    *bool   `json:"is_active"`
}

// MenuSection is one category of the public menu with its active items.
type MenuSection struct {
	Category string     `json:"category"`
	Title    string     `json:"title"`
	Order    int        `json:"order"`
	Items    []MenuItem `json:"items"`
}

// BranchMenu is the public payload for one branch: its details plus its menu.
type BranchMenu struct {
	Branch   PublicBranch  `json:"branch"`
	Sections []MenuSection `json:"sections"`
}

// Admin is the authenticated user for the admin panel.
type Admin struct {
	ID           primitive.ObjectID `json:"id"         bson:"_id"`
	Username     string             `json:"username"   bson:"username"`
	PasswordHash string             `json:"-"          bson:"password_hash"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// LoginRequest is the payload for POST /api/auth/login.
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse is returned after a successful login.
type LoginResponse struct {
	Token string `json:"token"`
	Admin struct {
		Username string `json:"username"`
	} `json:"admin"`
}
