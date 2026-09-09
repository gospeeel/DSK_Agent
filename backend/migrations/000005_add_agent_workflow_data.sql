-- Negotiation needs an explicit district; it cannot be inferred reliably from
-- a free-form building address.
ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS district VARCHAR(255);

-- Construction analytics reuses the existing progress entity. These fields
-- are explicit facts and are not derived from dates or status heuristics.
ALTER TABLE construction_progress
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS delay_days INT;

DO $$ BEGIN
    ALTER TABLE construction_progress
        ADD CONSTRAINT construction_progress_risk_level_valid
        CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE construction_progress
        ADD CONSTRAINT construction_progress_delay_days_nonnegative
        CHECK (delay_days IS NULL OR delay_days >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    price_per_sqm BIGINT,
    advantages TEXT,
    disadvantages TEXT,
    CONSTRAINT competitors_price_nonnegative
        CHECK (price_per_sqm IS NULL OR price_per_sqm >= 0)
);

CREATE INDEX IF NOT EXISTS competitors_district_idx
    ON competitors (LOWER(district));

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    deal_id INT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    kind VARCHAR(100) NOT NULL,
    recommendation TEXT NOT NULL,
    request_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recommendations_deal_id_idx
    ON recommendations (deal_id);
