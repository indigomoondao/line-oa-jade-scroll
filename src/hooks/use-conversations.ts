"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Conversation, Message } from "@/conversation/domain";
import {
  fetchConversations,
  ConversationApiError,
} from "@/lib/conversation-api";
import {
  applyMessageToConversations,
  sortConversations,
} from "@/lib/conversation-state";

type UseConversationsResult = {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  applyMessage: (message: Message) => boolean;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ConversationApiError) {
    return error.message;
  }

  return "Failed to load conversations";
}

export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const nextConversations = sortConversations(await fetchConversations());

      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(null);
      conversationsRef.current = nextConversations;
      setConversations(nextConversations);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setError(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const applyMessage = useCallback((message: Message) => {
    const result = applyMessageToConversations(
      conversationsRef.current,
      message,
    );

    if (result.matched) {
      conversationsRef.current = result.conversations;
      setConversations(result.conversations);
    }

    return result.matched;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refetch);
  }, [refetch]);

  return {
    conversations,
    isLoading,
    error,
    refetch,
    applyMessage,
  };
}
