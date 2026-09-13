-- Add new lifecycle statuses to chat_session_status if not already present
ALTER TYPE chat_session_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE chat_session_status ADD VALUE IF NOT EXISTS 'contract';

-- Support soft delete (hiding) of chats by the client
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS chat_sessions_deleted_by_user_idx ON chat_sessions (id_user, deleted_by_user);
