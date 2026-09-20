import "server-only";

import { createLineMessagingGateway } from "@/adapter/line/line-messaging-gateway";
import { createPostgresConversationRepository } from "@/adapter/postgres/conversation-repository";
import { createConversationUseCase } from "@/application/conversation-usecase";

const conversationRepository = createPostgresConversationRepository();
const messagingGateway = createLineMessagingGateway();

export const conversationUseCase = createConversationUseCase({
  conversationRepository,
  messagingGateway,
});
