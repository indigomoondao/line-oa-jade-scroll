import type { Message } from "@/conversation/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MessageBubbleProps = Readonly<{
  message: Message;
}>;

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-lg px-4 py-3 sm:max-w-[70%]",
          isOutbound
            ? "bg-accent text-foreground"
            : "border border-border bg-card text-foreground",
        )}
      >
        <p className="wrap-break-word whitespace-pre-wrap text-[15px] leading-6 font-medium">
          {message.content}
        </p>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 text-xs tabular-nums",
            isOutbound ? "justify-end text-primary/70" : "text-muted-foreground",
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {message.status === "failed" ? (
            <Badge className="h-5 border-destructive/20 bg-destructive/10 px-1.5 text-destructive" variant="outline">
              Failed
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
