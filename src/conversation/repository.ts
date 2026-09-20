import type { Contact, Conversation, Message } from "@/conversation/domain";

export type SaveInboundMessageInput = {
  externalUserId: string;
  externalMessageId: string;
  displayName: string | null;
  pictureUrl: string | null;
  content: string;
};

export type SaveOutboundMessageInput = {
  contactId: number;
  content: string;
  status: "sent" | "failed";
};

export interface ConversationRepository {
  listConversations(): Promise<Conversation[]>;

  findContactById(contactId: number): Promise<Contact | null>;

  listMessagesByContactId(contactId: number): Promise<Message[]>;

  listMessagesAfterId(messageId: number): Promise<Message[]>;

  saveInboundMessage(input: SaveInboundMessageInput): Promise<Message | null>;

  saveOutboundMessage(input: SaveOutboundMessageInput): Promise<Message>;
}
