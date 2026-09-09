package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DBHost                       string
	DBPort                       string
	DBUser                       string
	DBPass                       string
	DBName                       string
	Port                         string
	JWTSecret                    string
	RabbitMQURL                  string
	MaxManagerDiscountPercent    float64
	MaxSupervisorDiscountPercent float64
	CORSAllowedOrigins           []string
}

func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName)
}

// LoadConfig reads configuration values from environment variables.
func LoadConfig() *Config {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	managerDiscount := percentEnv("MAX_MANAGER_DISCOUNT_PERCENT", 5)
	supervisorDiscount := percentEnv("MAX_SUPERVISOR_DISCOUNT_PERCENT", 15)

	return &Config{
		DBHost:                       os.Getenv("DB_HOST"),
		DBPort:                       os.Getenv("DB_PORT"),
		DBUser:                       os.Getenv("DB_USER"),
		DBPass:                       os.Getenv("DB_PASS"),
		DBName:                       os.Getenv("DB_NAME"),
		Port:                         os.Getenv("PORT"),
		JWTSecret:                    os.Getenv("JWT_SECRET"),
		RabbitMQURL:                  rabbitURL,
		MaxManagerDiscountPercent:    managerDiscount,
		MaxSupervisorDiscountPercent: supervisorDiscount,
		CORSAllowedOrigins: stringListEnv(
			"CORS_ALLOWED_ORIGINS",
			[]string{
				"http://localhost:5173",
				"http://127.0.0.1:5173",
				"http://localhost:4173",
				"http://127.0.0.1:4173",
			},
		),
	}
}

func stringListEnv(name string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return append([]string(nil), fallback...)
	}
	items := make([]string, 0)
	seen := make(map[string]struct{})
	for _, raw := range strings.Split(value, ",") {
		item := strings.TrimSpace(raw)
		if item == "" {
			continue
		}
		if item == "*" {
			panic(fmt.Sprintf("%s must contain explicit origins when credentials are enabled", name))
		}
		if _, exists := seen[item]; exists {
			continue
		}
		seen[item] = struct{}{}
		items = append(items, item)
	}
	if len(items) == 0 {
		return append([]string(nil), fallback...)
	}
	return items
}

func percentEnv(name string, fallback float64) float64 {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil || parsed < 0 || parsed > 100 {
		panic(fmt.Sprintf("%s must be a number between 0 and 100", name))
	}
	return parsed
}
