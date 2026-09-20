"use client";

import type { ReactNode } from "react";

import type { Conversation, Message } from "@/conversation/domain";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatComposer } from "@/app/admin/_components/chat-composer";
import { MessageBubble } from "@/app/admin/_components/message-bubble";

type ChatPanelProps = Readonly<{
  className?: string;
  conversation: Conversation | null;
  error: string | null;
  isLoading: boolean;
  isSending: boolean;
  messages: Message[];
  onBack: () => void;
  onRetry: () => void;
  onSend: (content: string) => Promise<void>;
  sendError: string | null;
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

export function ChatPanel({
  className,
  conversation,
  error,
  isLoading,
  isSending,
  messages,
  onBack,
  onRetry,
  onSend,
  sendError,
}: ChatPanelProps) {
  if (!conversation) {
    return (
      <section
        className={cn(
          "min-h-0 flex-1 flex-col items-center justify-center bg-card p-8 text-center",
          className,
        )}
      >
        <h2 className="text-lg font-semibold text-foreground">
          Choose a conversation
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Select a contact to view messages and reply.
        </p>
      </section>
    );
  }

  const displayName = conversation.contact.displayName ?? "LINE visitor";
  let messageContent: ReactNode;

  if (isLoading) {
    messageContent = (
      <div className="space-y-4">
        <Skeleton className="h-14 w-2/3 rounded-lg" />
        <Skeleton className="ml-auto h-12 w-1/2 rounded-lg" />
        <Skeleton className="h-20 w-3/4 rounded-lg" />
      </div>
    );
  } else if (error) {
    messageContent = (
      <div className="flex flex-col items-center border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <p>{error}</p>
        <Button className="mt-3" onClick={onRetry} size="sm" variant="outline">
          <RefreshCw />
          Retry
        </Button>
      </div>
    );
  } else if (messages.length === 0) {
    messageContent = (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="font-medium text-foreground">No messages yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start the conversation with a reply below.
        </p>
      </div>
    );
  } else {
    messageContent = messages.map((message) => (
      <MessageBubble key={message.id} message={message} />
    ));
  }

  return (
    <section className={cn("min-h-0 flex-1 flex-col bg-card", className)}>
      <header className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
        <Button
          aria-label="Back to conversations"
          className="md:hidden"
          onClick={onBack}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowLeft />
        </Button>
        <Avatar size="default">
          {conversation.contact.pictureUrl ? (
            <AvatarImage alt="" src={conversation.contact.pictureUrl} />
          ) : null}
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {getInitials(conversation.contact.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold text-foreground">
            {displayName}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">LINE contact</p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6 sm:px-8">
          {messageContent}
        </div>
      </ScrollArea>

      <ChatComposer
        error={sendError}
        isSending={isSending}
        onSend={onSend}
      />
    </section>
  );
}
