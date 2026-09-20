"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Message } from "@/conversation/domain";
import {
  ConversationApiError,
  syncConversationMessages,
} from "@/lib/conversation-api";

type UseConversationSyncOptions = {
  enabled?: boolean;
  initialCursor?: number;
  intervalMs?: number;
  onMessages?: (messages: Message[]) => void;
};

type UseConversationSyncResult = {
  cursor: number;
  isSyncing: boolean;
  error: string | null;
  syncNow: () => Promise<boolean>;
  resetCursor: (cursor?: number) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ConversationApiError) {
    return error.message;
  }

  return "Failed to sync messages";
}

export function useConversationSync({
  enabled = true,
  initialCursor = 0,
  intervalMs = 2_000,
  onMessages,
}: UseConversationSyncOptions = {}): UseConversationSyncResult {
  const cursorRef = useRef(initialCursor);
  const initialCursorRef = useRef(initialCursor);
  const onMessagesRef = useRef(onMessages);
  const isSyncingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const [cursor, setCursor] = useState(initialCursor);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onMessagesRef.current = onMessages;
  }, [onMessages]);

  useEffect(() => {
    if (!hasStartedRef.current) {
      initialCursorRef.current = initialCursor;
      cursorRef.current = initialCursor;
      setCursor(initialCursor);
    }
  }, [initialCursor]);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) {
      return false;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncConversationMessages(cursorRef.current);

      onMessagesRef.current?.(result.messages);

      cursorRef.current = result.nextCursor;
      setCursor(result.nextCursor);
      return true;
    } catch (error) {
      setError(getErrorMessage(error));
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const resetCursor = useCallback((nextCursor = 0) => {
    initialCursorRef.current = nextCursor;
    cursorRef.current = nextCursor;
    setCursor(nextCursor);
    hasStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!hasStartedRef.current) {
      cursorRef.current = initialCursorRef.current;
      hasStartedRef.current = true;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) {
        return;
      }

      await syncNow();

      if (!cancelled) {
        timeoutId = setTimeout(() => {
          void poll();
        }, intervalMs);
      }
    }

    void poll();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, intervalMs, syncNow]);

  return {
    cursor,
    isSyncing,
    error,
    syncNow,
    resetCursor,
  };
}
