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
		port = "8081"
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

	constructionRepo := repository.NewConstructionRepository(dbpool)
	constructionService := service.NewConstructionService(constructionRepo)
	constructionHandler := handler.NewConstructionHandler(constructionService)

	chatRepo := repository.NewChatRepository(dbpool)
	chatService := service.NewChatService(chatRepo)
	chatHandler := handler.NewChatHandler(chatService)

	dealRepo := repository.NewDealRepository(dbpool)
	dealService := service.NewDealService(dealRepo)
	dealHandler := handler.NewDealHandler(dealService)

	aiService := service.NewAIAgentService(cfg.RabbitMQURL)
	defer aiService.Close()
	aiHandler := handler.NewAIHandler(aiService, chatService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	// Swagger UI Documentation
	r.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/", http.StatusMovedPermanently)
	})
	r.Get("/swagger/*", swagger.Handler(swagger.StaffSpec, "Staff Server API - Swagger UI"))
	
	r.Post("/api/auth/register", authHandler.CreateStaff)
	r.Post("/api/auth/login", authHandler.LoginStaff)
	r.Post("/api/auth/logout", authHandler.Logout)

	r.Group(func(r chi.Router) {
		r.Use(authHandler.AuthMiddleware)
		r.Use(authHandler.RequireStaffRole)
		
		r.Get("/api/staff/profile", authHandler.Profile)
		r.Get("/api/users", userHandler.GetUsers)
		r.Get("/api/users/{id}", userHandler.GetUser)

		// Staff Chat Management
		r.Get("/api/chat/sessions", chatHandler.GetAllSessions)
		r.Get("/api/chat/sessions/{id}", chatHandler.GetSession)
		r.Post("/api/chat/sessions/{id}/take", chatHandler.TakeSession)
		r.Post("/api/chat/sessions/{id}/close", chatHandler.CloseSession)
		r.Post("/api/chat/sessions/{id}/reject", chatHandler.RejectSession)
		r.Get("/api/chat/sessions/{id}/messages", chatHandler.GetMessages)
		r.Post("/api/chat/sessions/{id}/messages", chatHandler.SendMessage)

		// Staff Deals Management
		r.Post("/api/deals", dealHandler.CreateDeal)
		r.Get("/api/deals", dealHandler.GetAllDeals)
		r.Get("/api/deals/{id}", dealHandler.GetDeal)
		r.Put("/api/deals/{id}/status", dealHandler.UpdateDealStatus)

		// Staff AI Assistant
		r.Post("/api/ai/chat", aiHandler.Chat)

		// Construction CRUD
		r.Post("/api/complexes", constructionHandler.CreateComplex)
		r.Get("/api/complexes", constructionHandler.GetAllComplexes)
		r.Get("/api/complexes/{id}", constructionHandler.GetComplex)
		r.Put("/api/complexes/{id}", constructionHandler.UpdateComplex)
		r.Delete("/api/complexes/{id}", constructionHandler.DeleteComplex)
		r.Get("/api/complexes/{complexId}/buildings", constructionHandler.GetBuildingsByComplex)

		r.Post("/api/buildings", constructionHandler.CreateBuilding)
		r.Get("/api/buildings/{id}", constructionHandler.GetBuilding)
		r.Put("/api/buildings/{id}", constructionHandler.UpdateBuilding)
		r.Delete("/api/buildings/{id}", constructionHandler.DeleteBuilding)
		r.Get("/api/buildings/{buildingId}/apartments", constructionHandler.GetApartmentsByBuilding)
		r.Get("/api/buildings/{buildingId}/progress", constructionHandler.GetProgressByBuilding)

		r.Post("/api/apartments", constructionHandler.CreateApartment)
		r.Get("/api/apartments/{id}", constructionHandler.GetApartment)
		r.Put("/api/apartments/{id}", constructionHandler.UpdateApartment)
		r.Delete("/api/apartments/{id}", constructionHandler.DeleteApartment)

		r.Post("/api/progress", constructionHandler.CreateProgress)
		r.Get("/api/progress/{id}", constructionHandler.GetProgress)
		r.Put("/api/progress/{id}", constructionHandler.UpdateProgress)
		r.Delete("/api/progress/{id}", constructionHandler.DeleteProgress)
	})

	log.Printf("Starting Staff Server on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
