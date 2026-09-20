import "server-only";

type JsonRecord = Record<string, unknown>;

export type LineTextMessageEvent = {
  externalUserId: string;
  externalMessageId: string;
  content: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function parseJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error("Invalid LINE webhook JSON");
  }
}

export function parseLineWebhook(rawBody: string): LineTextMessageEvent[] {
  const payload = parseJson(rawBody);

  if (!isRecord(payload) || !Array.isArray(payload.events)) {
    throw new Error("Invalid LINE webhook payload");
  }

  return payload.events.flatMap((event): LineTextMessageEvent[] => {
    if (!isRecord(event) || event.type !== "message") {
      return [];
    }

    const source = isRecord(event.source) ? event.source : null;
    const message = isRecord(event.message) ? event.message : null;
    const externalUserId = source?.userId;
    const externalMessageId = message?.id;
    const content = message?.text;

    if (
      source?.type !== "user" ||
      typeof externalUserId !== "string" ||
      message?.type !== "text" ||
      typeof externalMessageId !== "string" ||
      typeof content !== "string"
    ) {
      return [];
    }

    return [
      {
        externalUserId,
        externalMessageId,
        content,
      },
    ];
  });
}
