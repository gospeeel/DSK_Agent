CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    deal_id INT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    base_price BIGINT NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL,
    final_price BIGINT NOT NULL,
    generated_text TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    approval_required BOOLEAN NOT NULL,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    request_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT offers_base_price_positive CHECK (base_price > 0),
    CONSTRAINT offers_final_price_nonnegative CHECK (final_price >= 0),
    CONSTRAINT offers_discount_valid CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT offers_status_valid CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS offers_deal_id_idx ON offers (deal_id);
