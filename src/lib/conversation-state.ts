import type { Conversation, Message } from "@/conversation/domain";

export function mergeMessages(
  current: Message[],
  incoming: Message[],
): Message[] {
  const messagesById = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    messagesById.set(message.id, message);
  }

  return [...messagesById.values()].sort((left, right) => left.id - right.id);
}

export function sortConversations(
  conversations: Conversation[],
): Conversation[] {
  return [...conversations].sort((left, right) => {
    const leftId = left.lastMessage?.id ?? 0;
    const rightId = right.lastMessage?.id ?? 0;

    return rightId - leftId;
  });
}

export function applyMessageToConversations(
  conversations: Conversation[],
  message: Message,
): { conversations: Conversation[]; matched: boolean } {
  let matched = false;

  const nextConversations = conversations.map((conversation) => {
    if (conversation.contact.id !== message.contactId) {
      return conversation;
    }

    matched = true;

    if (
      conversation.lastMessage &&
      conversation.lastMessage.id >= message.id
    ) {
      return conversation;
    }

    return {
      ...conversation,
      lastMessage: message,
    };
  });

  return {
    conversations: matched
      ? sortConversations(nextConversations)
      : conversations,
    matched,
  };
}
