"use client";

import { useCallback, useState } from "react";

import type { Message } from "@/conversation/domain";
import {
  ConversationApiError,
  createConversationMessage,
} from "@/lib/conversation-api";

type UseConversationSendMessageResult = {
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<Message>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ConversationApiError) {
    return error.message;
  }

  return "Failed to send message";
}

export function useConversationSendMessage(
  contactId: number | null,
): UseConversationSendMessageResult {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (contactId === null) {
        throw new Error("A conversation must be selected before sending");
      }

      setIsSending(true);
      setError(null);

      try {
        return await createConversationMessage(contactId, content);
      } catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [contactId],
  );

  return {
    isSending,
    error,
    sendMessage,
  };
}
