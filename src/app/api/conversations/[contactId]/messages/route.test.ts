import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactNotFoundError } from "@/conversation/errors";

const { getMessages, sendMessage } = vi.hoisted(() => ({
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  conversationUseCase: { getMessages, sendMessage },
}));

vi.mock("@/auth/with-admin-route", () => ({
  withAdminRoute: (handler: unknown) => handler,
}));

import {
  GET,
  POST,
} from "@/app/api/conversations/[contactId]/messages/route";

const routeContext = {
  params: Promise.resolve({ contactId: "42" }),
};

describe("/api/conversations/:contactId/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid contact id before reading messages", async () => {
    const response = await GET(
      new Request("http://localhost/api/conversations/not-a-number/messages"),
      { params: Promise.resolve({ contactId: "not-a-number" }) },
    );

    expect(response.status).toBe(400);
    expect(getMessages).not.toHaveBeenCalled();
  });

  it("maps a missing contact to 404", async () => {
    getMessages.mockRejectedValue(new ContactNotFoundError(42));

    const response = await GET(
      new Request("http://localhost/api/conversations/42/messages"),
      routeContext,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Contact 42 not found" });
  });

  it("rejects blank outbound content before calling the use case", async () => {
    const response = await POST(
      new Request("http://localhost/api/conversations/42/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "   " }),
      }),
      routeContext,
    );

    expect(response.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("passes validated content to the use case and returns a created message", async () => {
    sendMessage.mockResolvedValue({
      id: 50,
      contactId: 42,
      direction: "outbound",
      type: "text",
      content: "Welcome",
      status: "sent",
      externalMessageId: null,
      createdAt: new Date("2026-09-20T00:00:00.000Z"),
      updatedAt: new Date("2026-09-20T00:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/conversations/42/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Welcome" }),
      }),
      routeContext,
    );

    expect(sendMessage).toHaveBeenCalledWith({
      contactId: 42,
      content: "Welcome",
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: 50,
      content: "Welcome",
    });
  });
});
