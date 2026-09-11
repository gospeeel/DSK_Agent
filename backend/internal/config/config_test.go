package config

import (
	"reflect"
	"testing"
)

func TestLoadConfigUsesConfiguredCORSOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", " http://localhost:5173, https://frontend.example, http://localhost:5173 ")

	cfg := LoadConfig()
	want := []string{"http://localhost:5173", "https://frontend.example"}
	if !reflect.DeepEqual(cfg.CORSAllowedOrigins, want) {
		t.Fatalf("CORS origins = %#v, want %#v", cfg.CORSAllowedOrigins, want)
	}
}

func TestLoadConfigUsesLocalFrontendOriginsByDefault(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "")

	cfg := LoadConfig()
	want := []string{
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:4173",
		"http://127.0.0.1:4173",
	}
	if !reflect.DeepEqual(cfg.CORSAllowedOrigins, want) {
		t.Fatalf("default CORS origins = %#v, want %#v", cfg.CORSAllowedOrigins, want)
	}
}

func TestLoadConfigRejectsWildcardCORSOrigin(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "*")

	defer func() {
		if recover() == nil {
			t.Fatal("expected wildcard CORS origin to be rejected")
		}
	}()
	LoadConfig()
}

func TestLoadConfigParsesSMTPURL(t *testing.T) {
	t.Setenv("SMTP_URL", "smtp://notifications@dsk-agent.ru:mysecretpassword@smtp.yandex.ru:587")

	cfg := LoadConfig()
	if cfg.SMTPHost != "smtp.yandex.ru" || cfg.SMTPPort != "587" || cfg.SMTPUsername != "notifications@dsk-agent.ru" || cfg.SMTPPassword != "mysecretpassword" || cfg.SMTPFrom != "notifications@dsk-agent.ru" {
		t.Fatalf("unexpected SMTP config parsed: %+v", cfg)
	}
}

