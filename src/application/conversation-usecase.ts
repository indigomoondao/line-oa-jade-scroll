import type { Conversation, Message } from "@/conversation/domain";

import {
  ContactNotFoundError,
  InvalidMessageContentError,
} from "@/conversation/errors";

import type { ConversationRepository } from "@/conversation/repository";
import type { MessagingGateway } from "@/conversation/messaging-gateway";

export type ReceiveMessageInput = {
  externalUserId: string;
  externalMessageId: string;
  content: string;
};

export type SendMessageInput = {
  contactId: number;
  content: string;
};

type Dependencies = {
  conversationRepository: ConversationRepository;
  messagingGateway: MessagingGateway;
};

export function createConversationUseCase({
  conversationRepository,
  messagingGateway,
}: Dependencies) {
  async function listConversations(): Promise<Conversation[]> {
    return conversationRepository.listConversations();
  }

  async function getMessages(contactId: number): Promise<Message[]> {
    const contact = await conversationRepository.findContactById(contactId);

    if (!contact) {
      throw new ContactNotFoundError(contactId);
    }

    return conversationRepository.listMessagesByContactId(contactId);
  }

  async function syncMessages(messageId: number): Promise<Message[]> {
    return conversationRepository.listMessagesAfterId(messageId);
  }

  async function receiveMessage(
    input: ReceiveMessageInput,
  ): Promise<Message | null> {
    const content = input.content.trim();

    if (!content) {
      throw new InvalidMessageContentError();
    }

    const profile = await messagingGateway.getProfile(input.externalUserId);

    return conversationRepository.saveInboundMessage({
      externalUserId: input.externalUserId,
      externalMessageId: input.externalMessageId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      content,
    });
  }

  async function sendMessage(input: SendMessageInput): Promise<Message> {
    const content = input.content.trim();

    if (!content) {
      throw new InvalidMessageContentError();
    }

    const contact = await conversationRepository.findContactById(
      input.contactId,
    );

    if (!contact) {
      throw new ContactNotFoundError(input.contactId);
    }

    try {
      await messagingGateway.sendText({
        recipientId: contact.externalUserId,
        content,
      });
    } catch (error) {
      await conversationRepository.saveOutboundMessage({
        contactId: contact.id,
        content,
        status: "failed",
      });

      throw error;
    }

    return conversationRepository.saveOutboundMessage({
      contactId: contact.id,
      content,
      status: "sent",
    });
  }

  return {
    listConversations,
    getMessages,
    syncMessages,
    receiveMessage,
    sendMessage,
  };
}

export type ConversationUseCase = ReturnType<typeof createConversationUseCase>;
