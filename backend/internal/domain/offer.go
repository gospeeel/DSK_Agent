package domain

import "time"

type OfferStatus string

const (
	OfferStatusDraft           OfferStatus = "draft"
	OfferStatusPendingApproval OfferStatus = "pending_approval"
	OfferStatusApproved        OfferStatus = "approved"
	OfferStatusRejected        OfferStatus = "rejected"
)

type Offer struct {
	ID               int         `json:"id"`
	DealID           int         `json:"deal_id"`
	CreatedBy        int         `json:"created_by"`
	BasePrice        int64       `json:"base_price"`
	DiscountPercent  string      `json:"discount_percent"`
	FinalPrice       int64       `json:"final_price"`
	GeneratedText    string      `json:"generated_text"`
	Status           OfferStatus `json:"status"`
	ApprovalRequired bool        `json:"approval_required"`
	ApprovedBy       *int        `json:"approved_by"`
	ApprovedAt       *time.Time  `json:"approved_at"`
	CreatedAt        time.Time   `json:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at"`
}

type OfferCalculation struct {
	DealID             int    `json:"deal_id"`
	BasePrice          int64  `json:"base_price"`
	DiscountPercent    string `json:"discount_percent"`
	DiscountAmount     int64  `json:"discount_amount"`
	FinalPrice         int64  `json:"final_price"`
	MaxAllowedDiscount string `json:"max_allowed_discount"`
	RequiresApproval   bool   `json:"requires_approval"`
}
