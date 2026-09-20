import "server-only";

import { config } from "@/config/config";
import type {
  MessagingGateway,
  MessagingProfile,
  SendTextInput,
} from "@/conversation/messaging-gateway";

const LINE_API_BASE_URL = "https://api.line.me/v2/bot";
const LINE_REQUEST_TIMEOUT_MS = 5_000;

class LineApiError extends Error {
  constructor(operation: string, status: number) {
    super(`LINE ${operation} failed with status ${status}`);
    this.name = "LineApiError";
  }
}

async function assertSuccessfulResponse(
  response: Response,
  operation: string,
): Promise<void> {
  if (response.ok) {
    return;
  }

  await response.text();

  throw new LineApiError(operation, response.status);
}

function toMessagingProfile(payload: unknown): MessagingProfile {
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as { displayName?: unknown }).displayName !== "string"
  ) {
    throw new Error("LINE profile response has no display name");
  }

  const profile = payload as {
    displayName: string;
    pictureUrl?: unknown;
  };

  return {
    displayName: profile.displayName,
    pictureUrl:
      typeof profile.pictureUrl === "string" ? profile.pictureUrl : null,
  };
}

function createHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${config.line.channelAccessToken}`,
  };
}

function createTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(LINE_REQUEST_TIMEOUT_MS);
}

export function createLineMessagingGateway(): MessagingGateway {
  return {
    async getProfile(externalUserId: string): Promise<MessagingProfile> {
      const response = await fetch(
        `${LINE_API_BASE_URL}/profile/${encodeURIComponent(externalUserId)}`,
        {
          cache: "no-store",
          headers: createHeaders(),
          signal: createTimeoutSignal(),
        },
      );

      await assertSuccessfulResponse(response, "profile request");

      return toMessagingProfile(await response.json());
    },

    async sendText(input: SendTextInput): Promise<void> {
      const response = await fetch(`${LINE_API_BASE_URL}/message/push`, {
        method: "POST",
        headers: {
          ...createHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: input.recipientId,
          messages: [
            {
              type: "text",
              text: input.content,
            },
          ],
        }),
        signal: createTimeoutSignal(),
      });

      await assertSuccessfulResponse(response, "push message request");
    },
  };
}
