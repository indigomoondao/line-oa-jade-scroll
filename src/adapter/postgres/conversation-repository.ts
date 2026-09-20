import "server-only";

import type { Contact, Conversation, Message } from "@/conversation/domain";
import type {
  ConversationRepository,
  SaveInboundMessageInput,
  SaveOutboundMessageInput,
} from "@/conversation/repository";

import { sql } from "@/adapter/postgres/db";

type ContactRow = {
  id: number | string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type MessageRow = {
  id: number | string;
  contact_id: number | string;
  line_message_id: string | null;
  direction: "inbound" | "outbound";
  type: "text";
  content: string;
  status: "received" | "sent" | "failed";
  created_at: Date | string;
  updated_at: Date | string;
};

type ConversationRow = ContactRow & {
  last_message_id: number | string | null;
  last_message_contact_id: number | string | null;
  last_message_line_id: string | null;
  last_message_direction: "inbound" | "outbound" | null;
  last_message_type: "text" | null;
  last_message_content: string | null;
  last_message_status: "received" | "sent" | "failed" | null;
  last_message_created_at: Date | string | null;
  last_message_updated_at: Date | string | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toContact(row: ContactRow): Contact {
  return {
    id: Number(row.id),
    externalUserId: row.line_user_id,
    displayName: row.display_name,
    pictureUrl: row.picture_url,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function toMessage(row: MessageRow): Message {
  const base = {
    id: Number(row.id),
    contactId: Number(row.contact_id),
    type: row.type,
    content: row.content,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };

  if (row.direction === "inbound") {
    if (!row.line_message_id || row.status !== "received") {
      throw new Error("Invalid inbound message row");
    }

    return {
      ...base,
      direction: "inbound",
      status: "received",
      externalMessageId: row.line_message_id,
    };
  }

  if (row.status !== "sent" && row.status !== "failed") {
    throw new Error("Invalid outbound message row");
  }

  return {
    ...base,
    direction: "outbound",
    status: row.status,
    externalMessageId: null,
  };
}

function toConversation(row: ConversationRow): Conversation {
  const contact = toContact(row);

  if (row.last_message_id === null) {
    return {
      contact,
      lastMessage: null,
    };
  }

  if (
    row.last_message_contact_id === null ||
    row.last_message_direction === null ||
    row.last_message_type === null ||
    row.last_message_content === null ||
    row.last_message_status === null ||
    row.last_message_created_at === null ||
    row.last_message_updated_at === null
  ) {
    throw new Error("Invalid conversation row");
  }

  return {
    contact,
    lastMessage: toMessage({
      id: row.last_message_id,
      contact_id: row.last_message_contact_id,
      line_message_id: row.last_message_line_id,
      direction: row.last_message_direction,
      type: row.last_message_type,
      content: row.last_message_content,
      status: row.last_message_status,
      created_at: row.last_message_created_at,
      updated_at: row.last_message_updated_at,
    }),
  };
}

export function createPostgresConversationRepository(): ConversationRepository {
  return {
    async listConversations(): Promise<Conversation[]> {
      const rows = await sql`
        SELECT
          c.id,
          c.line_user_id,
          c.display_name,
          c.picture_url,
          c.created_at,
          c.updated_at,

          m.id AS last_message_id,
          m.contact_id AS last_message_contact_id,
          m.line_message_id AS last_message_line_id,
          m.direction AS last_message_direction,
          m.type AS last_message_type,
          m.content AS last_message_content,
          m.status AS last_message_status,
          m.created_at AS last_message_created_at,
          m.updated_at AS last_message_updated_at
        FROM contacts c
        LEFT JOIN messages m
          ON m.id = c.last_message_id
        ORDER BY c.last_message_id DESC NULLS LAST
      `;

      return (rows as ConversationRow[]).map(toConversation);
    },

    async findContactById(contactId: number): Promise<Contact | null> {
      const rows = await sql`
        SELECT
          id,
          line_user_id,
          display_name,
          picture_url,
          created_at,
          updated_at
        FROM contacts
        WHERE id = ${contactId}
        LIMIT 1
      `;

      const row = (rows as ContactRow[])[0];

      return row ? toContact(row) : null;
    },

    async listMessagesByContactId(contactId: number): Promise<Message[]> {
      const rows = await sql`
        SELECT
          id,
          contact_id,
          line_message_id,
          direction,
          type,
          content,
          status,
          created_at,
          updated_at
        FROM messages
        WHERE contact_id = ${contactId}
        ORDER BY id ASC
      `;

      return (rows as MessageRow[]).map(toMessage);
    },

    async listMessagesAfterId(messageId: number): Promise<Message[]> {
      const rows = await sql`
        SELECT
          id,
          contact_id,
          line_message_id,
          direction,
          type,
          content,
          status,
          created_at,
          updated_at
        FROM messages
        WHERE id > ${messageId}
        ORDER BY id ASC
      `;

      return (rows as MessageRow[]).map(toMessage);
    },

    async saveInboundMessage(
      input: SaveInboundMessageInput,
    ): Promise<Message | null> {
      const rows = await sql`
        WITH upserted_contact AS (
          INSERT INTO contacts (
            line_user_id,
            display_name,
            picture_url
          )
          VALUES (
            ${input.externalUserId},
            ${input.displayName},
            ${input.pictureUrl}
          )
          ON CONFLICT (line_user_id)
          DO UPDATE SET
            display_name = EXCLUDED.display_name,
            picture_url = EXCLUDED.picture_url,
            updated_at = NOW()
          RETURNING id
        ),

        inserted_message AS (
          INSERT INTO messages (
            contact_id,
            line_message_id,
            direction,
            type,
            content,
            status
          )
          SELECT
            id,
            ${input.externalMessageId},
            'inbound',
            'text',
            ${input.content},
            'received'
          FROM upserted_contact

          ON CONFLICT (
            contact_id,
            line_message_id
          )
          WHERE line_message_id IS NOT NULL
          DO NOTHING

          RETURNING *
        ),

        updated_contact AS (
          UPDATE contacts AS c
          SET
            last_message_id = m.id,
            updated_at = NOW()
          FROM inserted_message AS m
          WHERE c.id = m.contact_id
        )

        SELECT *
        FROM inserted_message
      `;

      const row = (rows as MessageRow[])[0];

      return row ? toMessage(row) : null;
    },

    async saveOutboundMessage(input: SaveOutboundMessageInput): Promise<Message> {
      const rows = await sql`
        WITH inserted_message AS (
          INSERT INTO messages (
            contact_id,
            line_message_id,
            direction,
            type,
            content,
            status
          )
          VALUES (
            ${input.contactId},
            NULL,
            'outbound',
            'text',
            ${input.content},
            ${input.status}
          )
          RETURNING *
        ),

        updated_contact AS (
          UPDATE contacts AS c
          SET
            last_message_id = m.id,
            updated_at = NOW()
          FROM inserted_message AS m
          WHERE c.id = m.contact_id
        )

        SELECT *
        FROM inserted_message
      `;

      const row = (rows as MessageRow[])[0];

      if (!row) {
        throw new Error("Failed to save outbound message");
      }

      return toMessage(row);
    },
  };
}
