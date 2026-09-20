import { conversationUseCase } from "@/bootstrap";

export const runtime = "nodejs";

export async function GET() {
  try {
    const conversations = await conversationUseCase.listConversations();

    return Response.json(conversations);
  } catch {
    return Response.json(
      { error: "Failed to load conversations" },
      { status: 500 },
    );
  }
}
