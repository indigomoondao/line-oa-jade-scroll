import { beforeEach, describe, expect, it, vi } from "vitest";

const { listConversations } = vi.hoisted(() => ({
  listConversations: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  conversationUseCase: { listConversations },
}));

vi.mock("@/auth/with-admin-route", () => ({
  withAdminRoute: (handler: unknown) => handler,
}));

import { GET } from "@/app/api/conversations/route";

describe("GET /api/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the conversation list", async () => {
    listConversations.mockResolvedValue([
      {
        contact: { id: 42, displayName: "Zhang San" },
        lastMessage: { id: 100, content: "Hello" },
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/conversations"),
      undefined,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      {
        contact: { id: 42, displayName: "Zhang San" },
        lastMessage: { id: 100, content: "Hello" },
      },
    ]);
  });

  it("maps an unexpected use-case failure to 500", async () => {
    listConversations.mockRejectedValue(new Error("Database unavailable"));

    const response = await GET(
      new Request("http://localhost/api/conversations"),
      undefined,
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load conversations",
    });
  });
});
