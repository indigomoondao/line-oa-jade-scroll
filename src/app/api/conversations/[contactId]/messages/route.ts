import { z } from "zod";

import { conversationUseCase } from "@/bootstrap";
import {
  ContactNotFoundError,
  InvalidMessageContentError,
} from "@/conversation/errors";

export const runtime = "nodejs";

const contactIdSchema = z
  .string()
  .regex(/^\d+$/, "contactId must be a positive integer")
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value > 0,
    "contactId must be a positive integer",
  );

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2_000),
});

type RouteContext = {
  params: Promise<{ contactId: string }>;
};

function parseContactId(rawContactId: string) {
  return contactIdSchema.safeParse(rawContactId);
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { contactId: rawContactId } = await params;
  const parsedContactId = parseContactId(rawContactId);

  if (!parsedContactId.success) {
    return Response.json(
      { error: "Invalid contactId" },
      { status: 400 },
    );
  }

  try {
    const messages = await conversationUseCase.getMessages(
      parsedContactId.data,
    );

    return Response.json(messages);
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    return Response.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { contactId: rawContactId } = await params;
  const parsedContactId = parseContactId(rawContactId);

  if (!parsedContactId.success) {
    return Response.json(
      { error: "Invalid contactId" },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = sendMessageSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Message content must be between 1 and 2000 characters" },
      { status: 400 },
    );
  }

  try {
    const message = await conversationUseCase.sendMessage({
      contactId: parsedContactId.data,
      content: parsedBody.data.content,
    });

    return Response.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InvalidMessageContentError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to send message" },
      { status: 502 },
    );
  }
}
