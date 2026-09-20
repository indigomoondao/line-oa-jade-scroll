import { conversationUseCase } from "@/bootstrap";
import { withAdminRoute } from "@/auth/with-admin-route";

export const runtime = "nodejs";

export const GET = withAdminRoute(async () => {
  try {
    const conversations = await conversationUseCase.listConversations();

    return Response.json(conversations);
  } catch {
    return Response.json(
      { error: "Failed to load conversations" },
      { status: 500 },
    );
  }
});
