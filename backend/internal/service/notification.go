package service

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"backend/internal/config"
	"backend/internal/domain"
	"backend/internal/repository"
)

type NotificationService interface {
	NotifyConstructionUpdate(ctx context.Context, progress *domain.ConstructionProgress) error
	GetNotifications(ctx context.Context, userID int, unreadOnly bool) ([]*domain.Notification, error)
	MarkAsRead(ctx context.Context, id int, userID int) error
	MarkAllAsRead(ctx context.Context, userID int) error
}

type EmailSender interface {
	SendEmail(to string, subject string, body string) error
}

type smtpEmailSender struct {
	host     string
	port     string
	username string
	password string
	from     string
}

func NewSMTPEmailSender(cfg *config.Config) EmailSender {
	return &smtpEmailSender{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		username: cfg.SMTPUsername,
		password: cfg.SMTPPassword,
		from:     cfg.SMTPFrom,
	}
}

func (s *smtpEmailSender) SendEmail(to string, subject string, body string) error {
	if strings.TrimSpace(s.host) == "" || strings.TrimSpace(s.port) == "" {
		log.Printf("[SMTP Mock] Host not configured. Would send to %s | Subject: %s | Body: %s", to, subject, body)
		return nil
	}

	from := s.from
	if from == "" {
		from = "no-reply@dsk-agent.ru"
	}

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	var auth smtp.Auth
	if s.username != "" && s.password != "" {
		auth = smtp.PlainAuth("", s.username, s.password, s.host)
	}

	msg := []byte(fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body,
	))

	if err := smtp.SendMail(addr, auth, from, []string{to}, msg); err != nil {
		log.Printf("[SMTP Error] Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("[SMTP] Email successfully sent to %s | Subject: %s", to, subject)
	return nil
}

type notificationService struct {
	notificationRepo repository.NotificationRepository
	dealRepo         repository.DealRepository
	userRepo         repository.UserRepository
	emailSender      EmailSender
}

func NewNotificationService(
	notificationRepo repository.NotificationRepository,
	dealRepo repository.DealRepository,
	userRepo repository.UserRepository,
	emailSender EmailSender,
) NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
		dealRepo:         dealRepo,
		userRepo:         userRepo,
		emailSender:      emailSender,
	}
}

func (s *notificationService) NotifyConstructionUpdate(ctx context.Context, progress *domain.ConstructionProgress) error {
	if progress == nil {
		return nil
	}

	isDelay := progress.Status == domain.ProgressStatusDelayed || (progress.DelayDays != nil && *progress.DelayDays > 0)
	hasRisk := progress.RiskLevel != nil && (*progress.RiskLevel == "medium" || *progress.RiskLevel == "high")

	if !isDelay && !hasRisk {
		return nil
	}

	deals, err := s.dealRepo.GetDealsByBuildingID(ctx, progress.BuildingID)
	if err != nil {
		return err
	}
	if len(deals) == 0 {
		return nil
	}

	notifType := domain.NotificationTypeConstructionRisk
	title := fmt.Sprintf("Внимание: риск изменения сроков этапа %s", progress.StageName)
	if isDelay {
		notifType = domain.NotificationTypeConstructionDelay
		title = fmt.Sprintf("Изменение сроков строительства: этап %s", progress.StageName)
	}

	reason := strings.TrimSpace(progress.DelayReason)
	if reason == "" {
		reason = "технологические особенности производственного процесса"
	}

	var message string
	if isDelay {
		delayText := ""
		if progress.DelayDays != nil && *progress.DelayDays > 0 {
			delayText = fmt.Sprintf(" Срок сдвигается на %d дн.", *progress.DelayDays)
		}
		message = fmt.Sprintf("Уважаемый клиент! По вашему объекту зафиксирована задержка на этапе \"%s\".%s Причина: %s.", progress.StageName, delayText, reason)
	} else {
		riskLevel := "средний"
		if progress.RiskLevel != nil && *progress.RiskLevel == "high" {
			riskLevel = "высокий"
		}
		message = fmt.Sprintf("Уважаемый клиент! По вашему объекту зафиксирован %s уровень риска срыва сроков на этапе \"%s\". Причина: %s. Наши специалисты контролируют ситуацию.", riskLevel, progress.StageName, reason)
	}

	for _, deal := range deals {
		// 1. Создаем уведомление в личный кабинет
		notif := &domain.Notification{
			UserID:  deal.UserID,
			DealID:  &deal.ID,
			Type:    notifType,
			Title:   title,
			Message: message,
			IsRead:  false,
		}
		if _, err := s.notificationRepo.CreateNotification(ctx, notif); err != nil {
			log.Printf("[Notification] Failed to create in-app notification for user %d: %v", deal.UserID, err)
		}

		// 2. Отправляем email клиенту
		user, err := s.userRepo.GetUserByID(ctx, deal.UserID)
		if err == nil && user != nil && user.Email != "" {
			emailSubject := title
			emailBody := fmt.Sprintf("Здравствуйте, %s!\n\n%s\n\nС уважением,\nКоманда застройщика", user.Name, message)
			go func(to, subj, body string) {
				_ = s.emailSender.SendEmail(to, subj, body)
			}(user.Email, emailSubject, emailBody)
		}
	}

	return nil
}

func (s *notificationService) GetNotifications(ctx context.Context, userID int, unreadOnly bool) ([]*domain.Notification, error) {
	return s.notificationRepo.GetNotificationsByUserID(ctx, userID, unreadOnly)
}

func (s *notificationService) MarkAsRead(ctx context.Context, id int, userID int) error {
	return s.notificationRepo.MarkAsRead(ctx, id, userID)
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, userID int) error {
	return s.notificationRepo.MarkAllAsRead(ctx, userID)
}
