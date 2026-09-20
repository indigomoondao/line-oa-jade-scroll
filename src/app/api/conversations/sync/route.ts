import { z } from "zod";

import { conversationUseCase } from "@/bootstrap";

export const runtime = "nodejs";

const cursorSchema = z
  .string()
  .regex(/^\d+$/, "cursor must be a non-negative integer")
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value >= 0,
    "cursor must be a non-negative integer",
  );

export async function GET(request: Request) {
  const cursorParam = new URL(request.url).searchParams.get("cursor") ?? "0";
  const parsedCursor = cursorSchema.safeParse(cursorParam);

  if (!parsedCursor.success) {
    return Response.json(
      { error: "Invalid cursor" },
      { status: 400 },
    );
  }

  try {
    const messages = await conversationUseCase.syncMessages(
      parsedCursor.data,
    );
    const lastMessage = messages[messages.length - 1];
    const nextCursor = lastMessage?.id ?? parsedCursor.data;

    return Response.json({
      messages,
      nextCursor,
    });
  } catch {
    return Response.json(
      { error: "Failed to sync messages" },
      { status: 500 },
    );
  }
}
