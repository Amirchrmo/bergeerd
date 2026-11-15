// Package seeder holds the data used to initialise an empty database: the
// default branch (the original Ardabil location) and its menu.
package seeder

import (
	"bytes"
	"context"
	_ "embed"
	"log"
	"os"
	"path/filepath"
	"strings"

	"bergeerd-api/internal/models"
	"bergeerd-api/internal/service"
)

// DefaultBranch is the branch existing data is attached to by the migration:
// the original location, served at the site root. Its contact details are the
// ones the website showed before they became editable.
func DefaultBranch() models.Branch {
	return models.Branch{
		Slug:        "ardabil",
		Name:        "اردبیل",
		Theme:       service.DefaultTheme,
		Order:       1,
		Address:     "اردبیل، پارک شهریار",
		Phone:       "+98 919 399 8029",
		Hours:       "هر روز ۱۲ تا ۱۵ : ۱۱",
		MapURL:      "https://maps.app.goo.gl/SuFQPrsjuxGb5SuD6",
		MapEmbedURL: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d302.68466979882555!2d48.2776719!3d38.239354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4018976cca86421b%3A0xebf6da6d1445251e!2sBergeerd%20%7C%20%D8%A8%D8%B1%DA%AF%D8%B1%D8%AF%E2%80%AD!5e1!3m2!1sen!2s!4v1732873870000!5m2!1sen!2s",
		Instagram:   "bergeerd",
	}
}

// DefaultCategories are the default branch's categories on a fresh install.
func DefaultCategories() []models.Category {
	return []models.Category{
		{Slug: "burgers", Title: "برگرها", Order: 1, IsActive: true},
		{Slug: "sandwiches", Title: "ساندویچ‌ها", Order: 2, IsActive: true},
		{Slug: "fries", Title: "سیب‌زمینی", Order: 3, IsActive: true},
		{Slug: "toppings", Title: "میتونی اضافه کنی...", Order: 4, IsActive: true},
		{Slug: "drinks", Title: "نوشیدنی‌ها", Order: 5, IsActive: true},
	}
}

// seedItem pairs a menu item with the local image file used to seed it.
type seedItem struct {
	models.MenuItem
	imageFile string
}

// defaultSeed mirrors the existing static menu on bergeerd.ir so that switching
// to the dynamic API preserves the current content. Prices are kept in Persian
// digit strings exactly as they appear on the live site.
func defaultSeed() []seedItem {
	return []seedItem{
		// ---- Burgers ----
		{models.MenuItem{Name: "کلاسیک برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با کاهو تازه،پیاز، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.", Price: "۵۹۰", ImageAlt: "برگر کلاسیک با مخلفات تازه", Category: "burgers", Order: 1, IsActive: true}, "real-classic.jpg"},
		{models.MenuItem{Name: "کارامل برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با پیاز کاراملی، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.", Price: "۶۶۰", ImageAlt: "برگر کارامل با مخلفات تازه", Category: "burgers", Order: 2, IsActive: true}, "real-karamel.jpg"},
		{models.MenuItem{Name: "اسپایسی برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با هالوپینو تند، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.", Price: "۶۴۰", ImageAlt: "برگر اسپایسی تند", Category: "burgers", Order: 3, IsActive: true}, "real-spoicy.jpg"},
		{models.MenuItem{Name: "چیز برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با دو ورق پنیر چدار ذوب شده، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.", Price: "۶۶۰", ImageAlt: "چیزبرگر با پنیر ذوب شده", Category: "burgers", Order: 4, IsActive: true}, "real-chiz.jpg"},
		{models.MenuItem{Name: "ماشروم برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با سس قارچ، کاهو تازه، گوجه،خیارشور و پیازچه روی نان کره ای به همراه سیب زمینی.", Price: "۶۹۰", ImageAlt: "ماشروم برگر با قارچ تازه", Category: "burgers", Order: 5, IsActive: true}, "real-mashroom.jpg"},
		{models.MenuItem{Name: "دودی برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با دو ورق پنیر دودی، کاهو تازه،پاپریکای کبابی، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.", Price: "۶۹۰", ImageAlt: "برگر دودی با طعم باربیکیو", Category: "burgers", Order: 6, IsActive: true}, "real-doody.jpg"},
		{models.MenuItem{Name: "محلی برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با پنیر لیقوان، ریحان تازه، گوجه و سس سیر روی نان کره ای به همراه سیب زمینی.", Price: "۶۶۰", ImageAlt: "برگر محلی با مواد محلی", Category: "burgers", Order: 7, IsActive: true}, "real-mahali.jpg"},
		{models.MenuItem{Name: "بیکن برگرد", Description: "۱۳۰ گرم گوشت گوساله آبدار با بیکن دودی، کاهو تازه،پیاز، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی", Price: "۷۲۰", ImageAlt: "برگر بیکن دودی", Category: "burgers", Order: 8, IsActive: true}, "real-beyken.jpg"},

		// ---- Sandwiches ----
		{models.MenuItem{Name: "ساندویچ مرغ", Description: "۱۲۰ گرم فیله مرغ با خیار، گوجه، ریحان تازه، و سس انبه و چیلی روی نان چاپاتا کره ای به همراه سیب زمینی.", Price: "۵۲۰", ImageAlt: "ساندویچ مرغ", Category: "sandwiches", Order: 1, IsActive: true}, "real-chiken.jpg"},

		// ---- Fries ----
		{models.MenuItem{Name: "سیب زمینی", Description: "سیب‌زمینی طلایی و ترد با ادویه برگرد.", Price: "۲۶۰", ImageAlt: "سیب‌زمینی طلایی ترد", Category: "fries", Order: 1, IsActive: true}, "sibzamini.jpg"},

		// ---- Toppings ----
		{models.MenuItem{Name: "گوشت ۶۵ گرمی اضافه", Description: "", Price: "۱۴۰", ImageAlt: "تاپینگ اضافه", Category: "toppings", Order: 1, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "بیکن", Description: "", Price: "۱۲۰", ImageAlt: "بیکن", Category: "toppings", Order: 2, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "پیاز کاراملی", Description: "", Price: "۶۰", ImageAlt: "پیاز کاراملی", Category: "toppings", Order: 3, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "قارچ", Description: "", Price: "۶۰", ImageAlt: "قارچ", Category: "toppings", Order: 4, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "هالوپینو", Description: "", Price: "۵۰", ImageAlt: "هالوپینو", Category: "toppings", Order: 5, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "پنیر دودی", Description: "", Price: "۵۵", ImageAlt: "پنیر دودی", Category: "toppings", Order: 6, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "پنیر چدار", Description: "", Price: "۵۵", ImageAlt: "پنیر چدار", Category: "toppings", Order: 7, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "سس سیر", Description: "", Price: "۵۰", ImageAlt: "سس سیر", Category: "toppings", Order: 8, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "سس هالوپینو", Description: "", Price: "۵۰", ImageAlt: "سس هالوپینو", Category: "toppings", Order: 9, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "سس دودی", Description: "", Price: "۷۰", ImageAlt: "سس دودی", Category: "toppings", Order: 10, IsActive: true}, "top.png"},
		{models.MenuItem{Name: "سس چیلی انبه", Description: "", Price: "۶۰", ImageAlt: "سس چیلی انبه", Category: "toppings", Order: 11, IsActive: true}, "top.png"},

		// ---- Drinks ----
		{models.MenuItem{Name: "کولا", Description: "کولا با یخ.", Price: "۸۵", ImageAlt: "کولا خنک‌کننده با یخ", Category: "drinks", Order: 1, IsActive: true}, "cola.jpg"},
		{models.MenuItem{Name: "زیرو", Description: "کولا زیرو بدون قند با یخ.", Price: "۸۵", ImageAlt: "کولا زیرو بدون قند", Category: "drinks", Order: 2, IsActive: true}, "cola.jpg"},
		{models.MenuItem{Name: "فانتا", Description: "نوشابه پرتغالی به همراه یخ", Price: "۸۵", ImageAlt: "نوشابه پرتغالی تازه و خنک", Category: "drinks", Order: 3, IsActive: true}, "fanta.png"},
	}
}

//go:embed placeholder.svg
var placeholder []byte

// BuildSeedItems returns the default menu, uploading each photo once from
// imagesDir (the website's src/assets). Missing photos get a placeholder so
// seeding never fails on images alone.
func BuildSeedItems(ctx context.Context, images service.ImageStore, imagesDir string) []models.MenuItem {
	uploaded := map[string]string{} // file name -> public URL
	urlFor := func(file string) string {
		if url, ok := uploaded[file]; ok {
			return url
		}
		url := uploadFile(ctx, images, imagesDir, file)
		if url == "" {
			url = upload(ctx, images, placeholder, "placeholder.svg")
		}
		uploaded[file] = url
		return url
	}

	seed := defaultSeed()
	out := make([]models.MenuItem, len(seed))
	for i, s := range seed {
		out[i] = s.MenuItem
		out[i].ImageURL = urlFor(s.imageFile)
	}
	return out
}

func uploadFile(ctx context.Context, images service.ImageStore, dir, file string) string {
	if dir == "" {
		return ""
	}
	data, err := os.ReadFile(filepath.Join(dir, file))
	if err != nil {
		log.Printf("seeder: %v", err)
		return ""
	}
	return upload(ctx, images, data, file)
}

func upload(ctx context.Context, images service.ImageStore, data []byte, name string) string {
	res, err := images.UploadImage(ctx, bytes.NewReader(data), int64(len(data)), name, contentTypeFor(name))
	if err != nil {
		log.Printf("seeder: upload %s: %v", name, err)
		return ""
	}
	return res.URL
}

func contentTypeFor(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	default:
		return "image/jpeg"
	}
}
