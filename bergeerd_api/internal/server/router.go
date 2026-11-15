package server

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"bergeerd-api/internal/auth"
	"bergeerd-api/internal/config"
	"bergeerd-api/internal/handler"
	"bergeerd-api/internal/middleware"
)

// New builds the configured Gin engine with all routes registered.
func New(
	cfg *config.Config,
	authH *handler.AuthHandler,
	branchH *handler.BranchHandler,
	menuH *handler.MenuHandler,
	categoryH *handler.CategoryHandler,
	jwtSvc *auth.JWTService,
) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.LoggerWithFormatter(loggerFormatter))
	r.Use(gin.Recovery())

	// CORS — allow the configured origins (admin panel + website).
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check (public, no auth).
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		// Public menus for the website. They change whenever the admin saves,
		// so browsers and the CDN must never serve a stale copy.
		pub := api.Group("", noCacheMiddleware)
		{
			pub.GET("/menu", menuH.DefaultMenu) // default branch; shape kept for old clients
			pub.GET("/branches/:slug/menu", menuH.BranchMenu)
		}

		api.POST("/auth/login", authH.Login)

		// Admin endpoints (JWT-protected). Listing and creating take the
		// branch via ?branch_id= / "branch_id" and default to the default
		// branch, so admin panels that predate branches keep working.
		admin := api.Group("/admin", middleware.JWTAuth(jwtSvc))
		{
			admin.GET("/branches", branchH.List)
			admin.GET("/branches/:id", branchH.Get)
			admin.POST("/branches", branchH.Create)
			admin.PUT("/branches/:id", branchH.Update)
			admin.DELETE("/branches/:id", branchH.Delete)

			admin.GET("/menu", menuH.List)
			admin.GET("/menu/:id", menuH.Get)
			admin.POST("/menu", menuH.Create)
			admin.PUT("/menu/:id", menuH.Update)
			admin.DELETE("/menu/:id", menuH.Delete)
			admin.POST("/upload", menuH.UploadImage)

			admin.GET("/categories", categoryH.List)
			admin.GET("/categories/:id", categoryH.Get)
			admin.POST("/categories", categoryH.Create)
			admin.PUT("/categories/:id", categoryH.Update)
			admin.DELETE("/categories/:id", categoryH.Delete)
		}
	}

	return r
}

// noCacheMiddleware stops browsers and proxies from caching public menus.
func noCacheMiddleware(c *gin.Context) {
	c.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Next()
}

// loggerFormatter produces concise single-line access logs.
func loggerFormatter(param gin.LogFormatterParams) string {
	if param.Latency > time.Minute {
		param.Latency = param.Latency.Truncate(time.Second)
	}
	return strings.Join([]string{
		param.TimeStamp.Format("2006-01-02 15:04:05"),
		param.ClientIP,
		param.Method,
		param.Path,
		param.StatusCodeColor(),
		http.StatusText(param.StatusCode),
		param.ResetColor(),
		param.Latency.String(),
		"\n",
	}, " ")
}
