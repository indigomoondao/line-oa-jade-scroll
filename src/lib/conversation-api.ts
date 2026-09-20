import type { Contact, Conversation, Message } from "@/conversation/domain";

type WireContact = Omit<Contact, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type WireMessage = {
  id: number;
  contactId: number;
  type: "text";
  content: string;
  direction: "inbound" | "outbound";
  status: "received" | "sent" | "failed";
  externalMessageId: string | null;
  createdAt: string;
  updatedAt: string;
};

type WireConversation = {
  contact: WireContact;
  lastMessage: WireMessage | null;
};

type WireConversationSyncResponse = {
  messages: WireMessage[];
  nextCursor: number;
};

export type ConversationSyncResponse = {
  messages: Message[];
  nextCursor: number;
};

export class ConversationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ConversationApiError";
  }
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Request failed";

    throw new ConversationApiError(message, response.status);
  }

  return payload as T;
}

function toDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError("Invalid date received from conversation API");
  }

  return date;
}

function toMessage(payload: WireMessage): Message {
  const baseMessage = {
    id: payload.id,
    contactId: payload.contactId,
    type: payload.type,
    content: payload.content,
    createdAt: toDate(payload.createdAt),
    updatedAt: toDate(payload.updatedAt),
  };

  if (payload.direction === "inbound") {
    if (payload.status !== "received" || payload.externalMessageId === null) {
      throw new TypeError("Invalid inbound message received from conversation API");
    }

    return {
      ...baseMessage,
      direction: "inbound",
      status: "received",
      externalMessageId: payload.externalMessageId,
    };
  }

  if (
    (payload.status !== "sent" && payload.status !== "failed") ||
    payload.externalMessageId !== null
  ) {
    throw new TypeError("Invalid outbound message received from conversation API");
  }

  return {
    ...baseMessage,
    direction: "outbound",
    status: payload.status,
    externalMessageId: null,
  };
}

function toConversation(payload: WireConversation): Conversation {
  return {
    contact: {
      ...payload.contact,
      createdAt: toDate(payload.contact.createdAt),
      updatedAt: toDate(payload.contact.updatedAt),
    },
    lastMessage: payload.lastMessage
      ? toMessage(payload.lastMessage)
      : null,
  };
}

export function fetchConversations(): Promise<Conversation[]> {
  return requestJson<WireConversation[]>("/api/conversations").then(
    (payload) => payload.map(toConversation),
  );
}

export function fetchConversationMessages(
  contactId: number,
): Promise<Message[]> {
  return requestJson<WireMessage[]>(
    `/api/conversations/${contactId}/messages`,
  ).then((payload) => payload.map(toMessage));
}

export function createConversationMessage(
  contactId: number,
  content: string,
): Promise<Message> {
  return requestJson<WireMessage>(
    `/api/conversations/${contactId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  ).then(toMessage);
}

export function syncConversationMessages(
  cursor: number,
): Promise<ConversationSyncResponse> {
  return requestJson<WireConversationSyncResponse>(
    `/api/conversations/sync?cursor=${cursor}`,
  ).then((payload) => ({
    messages: payload.messages.map(toMessage),
    nextCursor: payload.nextCursor,
  }));
}
