"use client";

import { useCallback, useMemo, useState } from "react";

import type { Message } from "@/conversation/domain";
import { useConversationMessages } from "@/hooks/use-conversation-messages";
import { useConversationSendMessage } from "@/hooks/use-conversation-send-message";
import { useConversationSync } from "@/hooks/use-conversation-sync";
import { useConversations } from "@/hooks/use-conversations";
import { ChatPanel } from "@/app/admin/_components/chat-panel";
import { ConversationDashboard } from "@/app/admin/_components/conversation-dashboard";
import { ConversationList } from "@/app/admin/_components/conversation-list";

export default function AdminPage() {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null,
  );
  const {
    conversations,
    isLoading: isConversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
    applyMessage,
  } = useConversations();
  const {
    messages,
    isLoading: areMessagesLoading,
    error: messagesError,
    refetch: refetchMessages,
    mergeMessages,
  } = useConversationMessages(selectedContactId);
  const {
    isSending,
    error: sendError,
    sendMessage,
  } = useConversationSendMessage(selectedContactId);
  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.contact.id === selectedContactId,
      ) ?? null,
    [conversations, selectedContactId],
  );
  const initialSyncCursor = useMemo(
    () =>
      conversations.reduce(
        (cursor, conversation) =>
          Math.max(cursor, conversation.lastMessage?.id ?? 0),
        0,
      ),
    [conversations],
  );

  const handleNewMessages = useCallback(
    (incomingMessages: Message[]) => {
      let shouldRefetchConversations = false;
      const selectedMessages: Message[] = [];

      for (const message of incomingMessages) {
        if (!applyMessage(message)) {
          shouldRefetchConversations = true;
        }

        if (message.contactId === selectedContactId) {
          selectedMessages.push(message);
        }
      }

      if (selectedMessages.length > 0) {
        mergeMessages(selectedMessages);
      }

      if (shouldRefetchConversations) {
        void refetchConversations();
      }
    },
    [
      applyMessage,
      mergeMessages,
      refetchConversations,
      selectedContactId,
    ],
  );

  useConversationSync({
    enabled: !isConversationsLoading,
    initialCursor: initialSyncCursor,
    onMessages: handleNewMessages,
  });

  const handleSendMessage = useCallback(
    async (content: string) => {
      const message = await sendMessage(content);
      const matchedConversation = applyMessage(message);

      if (!matchedConversation) {
        void refetchConversations();
      }

      mergeMessages(message);
    },
    [applyMessage, mergeMessages, refetchConversations, sendMessage],
  );

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col px-0">
      <ConversationDashboard>
        <ConversationList
          className={selectedContactId ? "hidden md:flex" : "flex"}
          conversations={conversations}
          error={conversationsError}
          isLoading={isConversationsLoading}
          selectedContactId={selectedContactId}
          onSelect={setSelectedContactId}
          onRetry={() => void refetchConversations()}
        />

        <ChatPanel
          className={selectedContactId ? "flex" : "hidden md:flex"}
          conversation={selectedConversation}
          error={messagesError}
          isLoading={areMessagesLoading}
          isSending={isSending}
          messages={messages}
          onBack={() => setSelectedContactId(null)}
          onRetry={() => void refetchMessages()}
          onSend={handleSendMessage}
          sendError={sendError}
        />
      </ConversationDashboard>
    </div>
  );
}
