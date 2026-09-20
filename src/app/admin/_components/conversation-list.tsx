"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Search } from "lucide-react";

import type { Conversation } from "@/conversation/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConversationItem } from "@/app/admin/_components/conversation-item";

type ConversationListProps = Readonly<{
  className?: string;
  conversations: Conversation[];
  error: string | null;
  isLoading: boolean;
  selectedContactId: number | null;
  onSelect: (contactId: number) => void;
  onRetry: () => void;
}>;

function getInitials(displayName: string | null) {
  if (!displayName) {
    return "?";
  }

  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ConversationList({
  className,
  conversations,
  error,
  isLoading,
  selectedContactId,
  onSelect,
  onRetry,
}: ConversationListProps) {
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name = conversation.contact.displayName?.toLowerCase() ?? "";
      const content = conversation.lastMessage?.content.toLowerCase() ?? "";

      return name.includes(normalizedQuery) || content.includes(normalizedQuery);
    });
  }, [conversations, query]);
  let conversationContent: ReactNode;

  if (isLoading) {
    conversationContent = (
      <div className="divide-y divide-border/70">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="flex items-center gap-3 px-4 py-3.5" key={index}>
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-44" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (error) {
    conversationContent = (
      <div className="m-4 border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="mb-2 size-4" />
        <p>{error}</p>
        <Button className="mt-3" onClick={onRetry} size="sm" variant="outline">
          <RefreshCw />
          Retry
        </Button>
      </div>
    );
  } else if (filteredConversations.length === 0) {
    conversationContent = (
      <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center">
        <p className="font-medium text-foreground">
          {query ? "No matching conversations" : "No conversations yet"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {query
            ? "Try another name or message."
            : "New LINE messages will appear here."}
        </p>
      </div>
    );
  } else {
    conversationContent = filteredConversations.map((conversation) => (
      <ConversationItem
        conversation={conversation}
        isSelected={conversation.contact.id === selectedContactId}
        key={conversation.contact.id}
        onSelect={onSelect}
        getInitials={getInitials}
      />
    ));
  }

  return (
    <aside
      className={cn(
        "min-h-0 w-full flex-col border-r border-border bg-card md:w-85 md:shrink-0",
        className,
      )}
    >
      <div className="space-y-4 px-4 pt-5 pb-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Conversations
          </h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {conversations.length}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search conversations"
            className="h-10 border-border bg-background pl-9 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            value={query}
          />
        </div>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversationContent}
      </div>
    </aside>
  );
}
