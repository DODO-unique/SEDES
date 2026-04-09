-- scheduled messages sql schema

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    uname TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1:1 relationship
CREATE TABLE IF NOT EXISTS running_sessions (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '1 hour'
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typename = 'enum_status') THEN
        CREATE TYPE enum_status AS ENUM ('pending', 'sent', 'failed');
    END IF;
END$$;

-- M:1 relationship
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    execute_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    job_status enum_status NOT NULL DEFAULT 'pending'
);

-- M:1 relationship for encryption keys
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encryption_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);