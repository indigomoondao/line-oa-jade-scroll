import type { Conversation } from "@/conversation/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ConversationItemProps = Readonly<{
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (contactId: number) => void;
  getInitials: (displayName: string | null) => string;
}>;

function formatTime(date: Date | null) {
  if (!date) {
    return "";
  }

  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();

  return new Intl.DateTimeFormat("en", {
    ...(isToday
      ? { hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric" }),
  }).format(date);
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  getInitials,
}: ConversationItemProps) {
  const { contact, lastMessage } = conversation;
  const displayName = contact.displayName ?? "LINE visitor";
  let preview = "No messages yet";

  if (lastMessage) {
    const prefix = lastMessage.direction === "outbound" ? "You: " : "";
    preview = `${prefix}${lastMessage.content}`;
  }

  return (
    <button
      className={cn(
        "group flex w-full items-center gap-3 border-b-2 border-border/70 border-l-2 border-l-transparent px-4 py-3.5 text-left transition-colors hover:bg-muted/70",
        isSelected && "border-l-primary bg-accent/60",
      )}
      onClick={() => onSelect(contact.id)}
      type="button"
    >
      <Avatar className="size-10" size="default">
        {contact.pictureUrl ? <AvatarImage alt="" src={contact.pictureUrl} /> : null}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {getInitials(contact.displayName)}
        </AvatarFallback>
      </Avatar>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-foreground">
            {displayName}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(lastMessage?.createdAt ?? null)}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 block truncate text-sm leading-5 text-muted-foreground",
            lastMessage?.direction === "outbound" && "text-primary/80",
          )}
        >
          {preview}
        </span>
      </span>
    </button>
  );
}
