package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"

	"voicemotion/config"
	"voicemotion/db"
	"voicemotion/handlers"
	"voicemotion/middleware"
	"voicemotion/models"
)

func main() {
	cfg := config.Load()
	connection, err := db.Open(cfg)
	if err != nil {
		log.Fatalf("Gagal membuka database: %v", err)
	}
	defer connection.Close()
	if err := db.Migrate(connection); err != nil {
		log.Fatalf("Gagal menjalankan migrasi: %v", err)
	}
	if err := db.SeedAdmin(connection, cfg); err != nil {
		log.Printf("Seed admin dilewati: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "tts"), 0o755); err != nil {
		log.Printf("Folder upload tidak bisa dibuat: %v", err)
	}
	styles, err := handlers.LoadStyles(cfg.StylesPath)
	if err != nil {
		log.Printf("Katalog gaya tidak bisa dimuat: %v", err)
		styles = []models.StylePack{}
	}
	handler := handlers.New(connection, cfg, styles)

	server := echo.New()
	server.HideBanner = true
	server.HidePort = true
	server.Use(echomiddleware.Recover())
	server.Use(echomiddleware.BodyLimit("300KB"))
	server.Use(middleware.CORS(cfg.CORSOrigins))
	server.Use(middleware.SecurityHeaders(cfg))

	server.GET("/api/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	server.GET("/api/auth/google", handler.GoogleLogin)
	server.GET("/api/auth/google/callback", handler.GoogleCallback)
	server.POST("/api/auth/login", handler.Login, middleware.RateLimit(10, time.Minute))
	server.POST("/api/auth/logout", handler.Logout)

	server.GET("/api/styles", handler.ListStyles)
	server.GET("/api/styles/:slug", handler.GetStyle)
	server.GET("/api/tts/audio/:filename", handler.ServeAudio)
	server.POST("/api/gemini/suggest-topics", handler.SuggestTopics)

	protected := server.Group("/api", middleware.JWT(cfg.JWTSecret, connection))
	protected.GET("/auth/me", handler.Me)
	protected.GET("/projects", handler.ListProjects)
	protected.POST("/projects", handler.CreateProject)
	protected.GET("/projects/:id", handler.GetProject)
	protected.PUT("/projects/:id", handler.UpdateProject)
	protected.DELETE("/projects/:id", handler.DeleteProject)
	protected.POST("/projects/:id/duplicate", handler.DuplicateProject)
	protected.GET("/projects/:id/scenes", handler.ListScenes)
	protected.PUT("/projects/:id/scenes", handler.SaveScenes)
	protected.GET("/tts/voices", handler.ListVoices)
	protected.POST("/tts/synthesize", handler.Synthesize, middleware.RateLimit(30, time.Minute))
	protected.GET("/credits/balance", handler.CreditBalance)
	protected.POST("/credits/spend", handler.SpendCredit)
	protected.POST("/exports", handler.CreateExport)

	admin := server.Group("/api/admin", middleware.JWT(cfg.JWTSecret, connection), middleware.AdminOnly())
	admin.GET("/overview", handler.AdminGetOverview)
	admin.GET("/assets", handler.AdminListAssets)
	admin.DELETE("/assets/:filename", handler.AdminDeleteAsset)
	admin.POST("/assets/cleanup", handler.AdminCleanupAssets)
	admin.GET("/projects", handler.AdminListProjects)
	admin.DELETE("/projects/:id", handler.AdminDeleteProject)
	admin.GET("/ledger", handler.AdminListLedger)
	admin.GET("/users", handler.AdminListUsers)
	admin.POST("/users", handler.AdminCreateUser)
	admin.PUT("/users/:id", handler.AdminUpdateUser)
	admin.POST("/users/:id/credits", handler.AdminAddCredits)
	admin.GET("/settings", handler.AdminGetSettings)
	admin.PUT("/settings", handler.AdminSaveSettings)
	admin.POST("/ai/test", handler.AdminTestAI)

	server.GET("/", handler.ServeStatic)
	server.HEAD("/", handler.ServeStatic)
	server.GET("/*", handler.ServeStatic)
	server.HEAD("/*", handler.ServeStatic)

	server.Server.ReadHeaderTimeout = 10 * time.Second
	server.Server.ReadTimeout = 30 * time.Second
	server.Server.WriteTimeout = 60 * time.Second
	server.Server.IdleTimeout = 120 * time.Second

	log.Printf("VoiceMotion Studio berjalan di http://localhost:%s", cfg.Port)
	if err := server.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server berhenti: %v", err)
	}
}
