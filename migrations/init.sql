BEGIN;

CREATE TABLE contacts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    line_user_id TEXT NOT NULL UNIQUE,

    display_name TEXT,
    picture_url TEXT,

    last_message_id BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    contact_id BIGINT NOT NULL
        REFERENCES contacts(id)
        ON DELETE CASCADE,

    line_message_id TEXT,

    direction TEXT NOT NULL
        CHECK (direction IN ('inbound', 'outbound')),

    type TEXT NOT NULL DEFAULT 'text'
        CHECK (type IN ('text')),

    content TEXT NOT NULL
        CHECK (length(trim(content)) > 0),

    status TEXT NOT NULL
        CHECK (status IN ('received', 'sent', 'failed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        (direction = 'inbound' AND status = 'received')
        OR
        (direction = 'outbound' AND status IN ('sent', 'failed'))
    ),

    CHECK (
        direction = 'outbound'
        OR line_message_id IS NOT NULL
    )
);

-- Idempotency / deduplication
CREATE UNIQUE INDEX uq_messages_contact_line_message
    ON messages (contact_id, line_message_id)
    WHERE line_message_id IS NOT NULL;

-- Conversation history
CREATE INDEX idx_messages_contact_id_id
    ON messages (contact_id, id DESC);

-- Inbox ordering
CREATE INDEX idx_contacts_last_message_id
    ON contacts (last_message_id DESC)
    WHERE last_message_id IS NOT NULL;

COMMIT;