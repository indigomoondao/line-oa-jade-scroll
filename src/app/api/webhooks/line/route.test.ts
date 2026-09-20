import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidMessageContentError } from "@/conversation/errors";

const { receiveMessage, parseLineWebhook, verifyLineSignature } = vi.hoisted(
  () => ({
    receiveMessage: vi.fn(),
    parseLineWebhook: vi.fn(),
    verifyLineSignature: vi.fn(),
  }),
);

vi.mock("@/bootstrap", () => ({
  conversationUseCase: { receiveMessage },
}));

vi.mock("@/adapter/line/line-webhook", () => ({ parseLineWebhook }));

vi.mock("@/adapter/line/line-signature", () => ({ verifyLineSignature }));

import { POST } from "@/app/api/webhooks/line/route";

function createRequest(body = "{\"events\":[]}", signature = "signature") {
  return new Request("http://localhost/api/webhooks/line", {
    method: "POST",
    body,
    headers: { "x-line-signature": signature },
  });
}

describe("POST /api/webhooks/line", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request with an invalid LINE signature", async () => {
    verifyLineSignature.mockReturnValue(false);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid webhook signature",
    });
    expect(parseLineWebhook).not.toHaveBeenCalled();
  });

  it("rejects a signed request whose payload cannot be parsed", async () => {
    verifyLineSignature.mockReturnValue(true);
    parseLineWebhook.mockImplementation(() => {
      throw new Error("Invalid payload");
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid webhook payload",
    });
  });

  it("dispatches every parsed event to the use case", async () => {
    const events = [
      {
        externalUserId: "U123",
        externalMessageId: "m1",
        content: "Hello",
      },
      {
        externalUserId: "U456",
        externalMessageId: "m2",
        content: "Welcome",
      },
    ];
    verifyLineSignature.mockReturnValue(true);
    parseLineWebhook.mockReturnValue(events);
    receiveMessage.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(receiveMessage).toHaveBeenNthCalledWith(1, events[0]);
    expect(receiveMessage).toHaveBeenNthCalledWith(2, events[1]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("maps invalid message content from the use case to 400", async () => {
    verifyLineSignature.mockReturnValue(true);
    parseLineWebhook.mockReturnValue([
      {
        externalUserId: "U123",
        externalMessageId: "m1",
        content: "Hello",
      },
    ]);
    receiveMessage.mockRejectedValue(new InvalidMessageContentError());

    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Message content must not be empty",
    });
  });
});
