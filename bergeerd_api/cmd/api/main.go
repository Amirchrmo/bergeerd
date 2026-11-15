package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"bergeerd-api/internal/auth"
	"bergeerd-api/internal/config"
	"bergeerd-api/internal/database"
	"bergeerd-api/internal/handler"
	"bergeerd-api/internal/models"
	"bergeerd-api/internal/repository"
	"bergeerd-api/internal/seeder"
	"bergeerd-api/internal/server"
	"bergeerd-api/internal/service"
	"bergeerd-api/internal/storage"
)

func main() {
	cfg := config.Load()
	log.Printf("starting bergeerd-api — %s", cfg)

	db, err := database.ConnectMongo(cfg.MongoURI, cfg.MongoDatabase)
	if err != nil {
		log.Fatalf("mongo: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = db.Client().Disconnect(ctx)
	}()

	store, err := storage.NewMinio(cfg.MinioEndpoint, cfg.MinioAccessKey, cfg.MinioSecretKey,
		cfg.MinioBucket, cfg.MinioPublicURL, cfg.MinioUseSSL)
	if err != nil {
		log.Fatalf("minio: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	branchRepo := repository.NewBranchRepo(db)
	categoryRepo := repository.NewCategoryRepo(db)
	menuRepo := repository.NewMenuItemRepo(db)
	adminRepo := repository.NewAdminRepo(db)

	// Bring a single-menu database to the multi-branch schema (no-op once done).
	def, err := repository.MigrateToBranches(ctx, db, seeder.DefaultBranch())
	if err != nil {
		log.Fatalf("migrate: %v", err)
	}
	for name, ensure := range map[string]func(context.Context) error{
		"branch": branchRepo.EnsureIndexes, "category": categoryRepo.EnsureIndexes,
		"menu": menuRepo.EnsureIndexes, "admin": adminRepo.EnsureIndexes,
	} {
		if err := ensure(ctx); err != nil {
			log.Fatalf("%s indexes: %v", name, err)
		}
	}

	categorySvc := service.NewCategoryService(categoryRepo)
	menuSvc := service.NewMenuService(menuRepo, store, categorySvc)
	branchSvc := service.NewBranchService(branchRepo, categorySvc, menuSvc)
	jwtSvc := auth.NewJWTService(cfg.JWTSecret, cfg.JWTExpHours)
	authSvc := service.NewAuthService(adminRepo, jwtSvc)

	seed(ctx, cfg, def, authSvc, categorySvc, menuSvc, store)

	router := server.New(cfg,
		handler.NewAuthHandler(authSvc),
		handler.NewBranchHandler(branchSvc),
		handler.NewMenuHandler(menuSvc, branchSvc),
		handler.NewCategoryHandler(categorySvc, branchSvc),
		jwtSvc,
	)
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("http server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("forced shutdown: %v", err)
	}
	log.Println("server stopped")
}

// seed fills an empty database: the admin account, the default branch's
// categories and, with SEED_MENU, its menu. Existing data is never touched.
func seed(ctx context.Context, cfg *config.Config, def models.Branch, authSvc *service.AuthService,
	categorySvc *service.CategoryService, menuSvc *service.MenuService, images service.ImageStore) {
	if cfg.SeedAdmin {
		if err := authSvc.SeedAdminIfEmpty(ctx, cfg.AdminUsername, cfg.AdminPassword); err != nil {
			log.Printf("seed admin: %v", err)
		}
	}
	if err := categorySvc.SeedIfEmpty(ctx, def.ID, seeder.DefaultCategories()); err != nil {
		log.Printf("seed categories: %v", err)
	}
	if !cfg.SeedMenu {
		return
	}
	// Building the seed uploads photos, so only do it for an empty menu;
	// otherwise every restart would leave orphaned objects in MinIO.
	n, err := menuSvc.Count(ctx, def.ID)
	if err != nil || n > 0 {
		log.Printf("seed menu: %d items present (%v)", n, err)
		return
	}
	// SEED_IMAGES_DIR optionally points at the website's src/assets.
	items := seeder.BuildSeedItems(ctx, images, os.Getenv("SEED_IMAGES_DIR"))
	if err := menuSvc.Seed(ctx, def.ID, items); err != nil && !mongo.IsDuplicateKeyError(err) {
		log.Printf("seed menu: %v", err)
	}
}
