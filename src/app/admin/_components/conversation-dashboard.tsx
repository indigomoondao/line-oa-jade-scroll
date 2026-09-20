import type { ReactNode } from "react";

type ConversationDashboardProps = Readonly<{
  children: ReactNode;
}>;

export function ConversationDashboard({
  children,
}: ConversationDashboardProps) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden border-x border-border bg-card">
      {children}
    </div>
  );
}
