"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = Readonly<{
  error: string | null;
  isSending: boolean;
  onSend: (content: string) => Promise<void>;
}>;

export function ChatComposer({ error, isSending, onSend }: ChatComposerProps) {
  const [content, setContent] = useState("");

  async function handleSubmit() {
    const trimmedContent = content.trim();

    if (!trimmedContent || isSending) {
      return;
    }

    try {
      await onSend(trimmedContent);
      setContent("");
    } catch {
      // The hook exposes the error for the composer to render.
    }
  }

  return (
    <div className="border-t border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-border bg-background p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
        <Textarea
          aria-label="Message"
          className="min-h-11 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0"
          disabled={isSending}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Write a reply..."
          rows={1}
          value={content}
        />
        <Button
          aria-label="Send message"
          disabled={!content.trim() || isSending}
          onClick={() => void handleSubmit()}
          size="icon"
          type="button"
        >
          <Send />
        </Button>
      </div>
      {error ? (
        <p className="mx-auto mt-2 max-w-3xl px-2 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
      <p className="mx-auto mt-2 max-w-3xl px-2 text-xs text-muted-foreground">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
