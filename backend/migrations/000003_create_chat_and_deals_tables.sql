-- Create ENUMs for chat and deals
DO $$ BEGIN
    CREATE TYPE chat_session_status AS ENUM ('open', 'in_progress', 'close');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('pending', 'contract', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id) ON DELETE SET NULL,
    id_employee INT REFERENCES users(id) ON DELETE SET NULL,
    id_apartment INT REFERENCES apartments(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    status chat_session_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_session_rejections
CREATE TABLE IF NOT EXISTS chat_session_rejections (
    id SERIAL PRIMARY KEY,
    id_chat_sessions INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    id_employee INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    id_chat_session INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    id_user INT REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(50) NOT NULL DEFAULT 'client',
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sended_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: deals
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_employee INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_apartment INT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    base_price DECIMAL(15, 2) NOT NULL,
    percent_discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(15, 2) NOT NULL,
    status deal_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
