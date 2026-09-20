"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Message } from "@/conversation/domain";
import {
  ConversationApiError,
  fetchConversationMessages,
} from "@/lib/conversation-api";
import { mergeMessages } from "@/lib/conversation-state";

type UseConversationMessagesResult = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mergeMessages: (incoming: Message | Message[]) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ConversationApiError) {
    return error.message;
  }

  return "Failed to load messages";
}

export function useConversationMessages(
  contactId: number | null,
): UseConversationMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadedContactId, setLoadedContactId] = useState<number | null>(null);
  const [resolvedContactId, setResolvedContactId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(contactId !== null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (contactId === null) {
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      const nextMessages = await fetchConversationMessages(contactId);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(null);
      setMessages(mergeMessages([], nextMessages));
      setLoadedContactId(contactId);
      setResolvedContactId(contactId);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setError(getErrorMessage(error));
        setResolvedContactId(contactId);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [contactId]);

  const mergeIncomingMessages = useCallback(
    (incoming: Message | Message[]) => {
      const nextMessages = (Array.isArray(incoming) ? incoming : [incoming])
        .filter((message) => message.contactId === contactId);

      setMessages((current) => mergeMessages(current, nextMessages));
    },
    [contactId],
  );

  useEffect(() => {
    if (contactId === null) {
      return;
    }

    void Promise.resolve().then(refetch);
  }, [contactId, refetch]);

  return {
    messages: loadedContactId === contactId ? messages : [],
    isLoading: contactId !== null && resolvedContactId !== contactId
      ? true
      : isLoading,
    error,
    refetch,
    mergeMessages: mergeIncomingMessages,
  };
}
