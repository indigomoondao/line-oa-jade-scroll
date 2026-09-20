import { describe, expect, it, vi } from "vitest";

import { createConversationUseCase } from "@/application/conversation-usecase";
import type { Contact, Message } from "@/conversation/domain";
import {
  ContactNotFoundError,
  InvalidMessageContentError,
} from "@/conversation/errors";
import type { MessagingGateway } from "@/conversation/messaging-gateway";
import type { ConversationRepository } from "@/conversation/repository";

const contact: Contact = {
  id: 42,
  externalUserId: "U123",
  displayName: "Zhang San",
  pictureUrl: null,
  createdAt: new Date("2026-09-20T00:00:00.000Z"),
  updatedAt: new Date("2026-09-20T00:00:00.000Z"),
};

const inboundMessage: Message = {
  id: 100,
  contactId: contact.id,
  direction: "inbound",
  type: "text",
  content: "Hello",
  status: "received",
  externalMessageId: "line-message-100",
  createdAt: new Date("2026-09-20T00:00:00.000Z"),
  updatedAt: new Date("2026-09-20T00:00:00.000Z"),
};

const outboundMessage: Message = {
  id: 101,
  contactId: contact.id,
  direction: "outbound",
  type: "text",
  content: "Welcome",
  status: "sent",
  externalMessageId: null,
  createdAt: new Date("2026-09-20T00:01:00.000Z"),
  updatedAt: new Date("2026-09-20T00:01:00.000Z"),
};

function createDependencies() {
  const repository = {
    listConversations: vi.fn(async () => []),
    findContactById: vi.fn(
      async (): Promise<Contact | null> => contact,
    ),
    listMessagesByContactId: vi.fn(async () => []),
    listMessagesAfterId: vi.fn(async () => []),
    saveInboundMessage: vi.fn(async () => inboundMessage),
    saveOutboundMessage: vi.fn(async () => outboundMessage),
  } satisfies ConversationRepository;
  const messagingGateway = {
    getProfile: vi.fn(async () => ({
      displayName: "Zhang San",
      pictureUrl: null,
    })),
    sendText: vi.fn(async () => undefined),
  } satisfies MessagingGateway;

  return {
    repository,
    messagingGateway,
    useCase: createConversationUseCase({
      conversationRepository: repository,
      messagingGateway,
    }),
  };
}

describe("conversation use case", () => {
  it("trims and persists an inbound message with the LINE profile", async () => {
    const { repository, messagingGateway, useCase } = createDependencies();

    const result = await useCase.receiveMessage({
      externalUserId: "U123",
      externalMessageId: "line-message-100",
      content: "  Hello  ",
    });

    expect(messagingGateway.getProfile).toHaveBeenCalledWith("U123");
    expect(repository.saveInboundMessage).toHaveBeenCalledWith({
      externalUserId: "U123",
      externalMessageId: "line-message-100",
      displayName: "Zhang San",
      pictureUrl: null,
      content: "Hello",
    });
    expect(result).toBe(inboundMessage);
  });

  it("rejects an empty inbound message before calling LINE", async () => {
    const { messagingGateway, useCase } = createDependencies();

    await expect(
      useCase.receiveMessage({
        externalUserId: "U123",
        externalMessageId: "line-message-100",
        content: "   ",
      }),
    ).rejects.toBeInstanceOf(InvalidMessageContentError);

    expect(messagingGateway.getProfile).not.toHaveBeenCalled();
  });

  it("returns ContactNotFoundError before loading a missing contact's history", async () => {
    const { repository, useCase } = createDependencies();
    repository.findContactById.mockResolvedValue(null);

    await expect(useCase.getMessages(999)).rejects.toBeInstanceOf(
      ContactNotFoundError,
    );

    expect(repository.listMessagesByContactId).not.toHaveBeenCalled();
  });

  it("sends text through LINE and records a sent outbound message", async () => {
    const { repository, messagingGateway, useCase } = createDependencies();

    const result = await useCase.sendMessage({
      contactId: contact.id,
      content: "  Welcome  ",
    });

    expect(messagingGateway.sendText).toHaveBeenCalledWith({
      recipientId: contact.externalUserId,
      content: "Welcome",
    });
    expect(repository.saveOutboundMessage).toHaveBeenCalledWith({
      contactId: contact.id,
      content: "Welcome",
      status: "sent",
    });
    expect(result).toBe(outboundMessage);
  });

  it("records a failed outbound message when LINE rejects delivery", async () => {
    const { repository, messagingGateway, useCase } = createDependencies();
    const lineError = new Error("LINE unavailable");
    messagingGateway.sendText.mockRejectedValue(lineError);

    await expect(
      useCase.sendMessage({
        contactId: contact.id,
        content: "Welcome",
      }),
    ).rejects.toBe(lineError);

    expect(repository.saveOutboundMessage).toHaveBeenCalledWith({
      contactId: contact.id,
      content: "Welcome",
      status: "failed",
    });
  });
});
