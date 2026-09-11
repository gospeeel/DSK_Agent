package main

import (
	"context"
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/swagger"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.LoadConfig()

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	dbpool, err := pgxpool.New(context.Background(), cfg.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer dbpool.Close()

	userRepo := repository.NewUserRepository(dbpool)
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(authService)

	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService, authService)

	dealRepo := repository.NewDealRepository(dbpool)
	dealService := service.NewDealService(dealRepo)
	dealHandler := handler.NewDealHandler(dealService)


	emailSender := service.NewSMTPEmailSender(cfg)
	notificationRepo := repository.NewNotificationRepository(dbpool)
	notificationService := service.NewNotificationService(notificationRepo, dealRepo, userRepo, emailSender)
	notificationHandler := handler.NewNotificationHandler(notificationService)

	constructionRepo := repository.NewConstructionRepository(dbpool)
	constructionService := service.NewConstructionService(constructionRepo, notificationService)
	constructionHandler := handler.NewConstructionHandler(constructionService)

	chatRepo := repository.NewChatRepository(dbpool)
	chatService := service.NewChatService(chatRepo)
	chatHandler := handler.NewChatHandler(chatService)

	aiService := service.NewAIAgentService(cfg.RabbitMQURL)
	defer aiService.Close()
	aiHandler := handler.NewAIHandler(aiService, chatService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	// Swagger UI Documentation
	r.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/", http.StatusMovedPermanently)
	})
	r.Get("/swagger/*", swagger.Handler(swagger.UserSpec, "User Server API - Swagger UI"))

	r.Post("/api/auth/register", authHandler.Register)
	r.Post("/api/auth/login", authHandler.Login)
	r.Post("/api/auth/logout", authHandler.Logout)

	// Chat session creation (authenticated or guest lead)
	r.With(authHandler.OptionalAuthMiddleware).Post("/api/chat/sessions", chatHandler.CreateSession)

	// Public Construction Routes
	r.Get("/api/complexes", constructionHandler.GetAllComplexes)
	r.Get("/api/complexes/{id}", constructionHandler.GetComplex)
	r.Get("/api/complexes/{complexId}/buildings", constructionHandler.GetBuildingsByComplex)

	r.Get("/api/buildings/{id}", constructionHandler.GetBuilding)
	r.Get("/api/buildings/{buildingId}/apartments", constructionHandler.GetApartmentsByBuilding)
	r.Get("/api/buildings/{buildingId}/progress", constructionHandler.GetProgressByBuilding)

	r.Get("/api/apartments/{id}", constructionHandler.GetApartment)
	r.Get("/api/progress/{id}", constructionHandler.GetProgress)

	r.Group(func(r chi.Router) {
		r.Use(authHandler.AuthMiddleware)
		r.Post("/api/ai/chat", aiHandler.Chat)
		r.Get("/api/auth/profile", authHandler.Profile)
		r.Get("/api/users/me", userHandler.GetMe)
		r.Put("/api/users/me", userHandler.UpdateMe)

		// Notifications routes
		r.Get("/api/notifications", notificationHandler.GetMyNotifications)
		r.Put("/api/notifications/read-all", notificationHandler.MarkAllAsRead)
		r.Put("/api/notifications/{id}/read", notificationHandler.MarkAsRead)

		// Client Chat routes
		r.Get("/api/chat/sessions", chatHandler.GetMySessions)
		r.Get("/api/chat/sessions/{id}", chatHandler.GetSession)
		r.Get("/api/chat/sessions/{id}/messages", chatHandler.GetMessages)
		r.Post("/api/chat/sessions/{id}/messages", chatHandler.SendMessage)

		// Client Deals routes
		r.Get("/api/deals", dealHandler.GetMyDeals)
		r.Get("/api/deals/{id}", dealHandler.GetDeal)
	})

	log.Printf("Starting User Server on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

