import { parseLineWebhook } from "@/adapter/line/line-webhook";
import { verifyLineSignature } from "@/adapter/line/line-signature";
import { conversationUseCase } from "@/bootstrap";
import { InvalidMessageContentError } from "@/conversation/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let events;

  try {
    events = parseLineWebhook(rawBody);
  } catch {
    return Response.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }

  try {
    for (const event of events) {
      await conversationUseCase.receiveMessage(event);
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    if (error instanceof InvalidMessageContentError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
