-- Link a deal to the chat session whose messages describe that deal.
ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS id_chat_session INT REFERENCES chat_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS deals_id_chat_session_idx
    ON deals (id_chat_session)
    WHERE id_chat_session IS NOT NULL;

-- Keep the extracted client profile flexible for the MVP while preserving
-- budget_max as the contract's dedicated top-level value.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS budget_max BIGINT,
    ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
    ALTER TABLE users
        ADD CONSTRAINT users_budget_max_nonnegative
        CHECK (budget_max IS NULL OR budget_max >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
