import { beforeEach, describe, expect, it, vi } from "vitest";

const { syncMessages } = vi.hoisted(() => ({
  syncMessages: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  conversationUseCase: { syncMessages },
}));

vi.mock("@/auth/with-admin-route", () => ({
  withAdminRoute: (handler: unknown) => handler,
}));

import { GET } from "@/app/api/conversations/sync/route";

describe("GET /api/conversations/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid cursor before calling the use case", async () => {
    const response = await GET(
      new Request("http://localhost/api/conversations/sync?cursor=-1"),
      undefined,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid cursor" });
    expect(syncMessages).not.toHaveBeenCalled();
  });

  it("returns messages and advances the cursor to the latest message id", async () => {
    syncMessages.mockResolvedValue([
      { id: 18, createdAt: new Date("2026-09-20T00:00:00.000Z") },
      { id: 19, createdAt: new Date("2026-09-20T00:01:00.000Z") },
    ]);

    const response = await GET(
      new Request("http://localhost/api/conversations/sync?cursor=17"),
      undefined,
    );

    expect(syncMessages).toHaveBeenCalledWith(17);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      nextCursor: 19,
      messages: [{ id: 18 }, { id: 19 }],
    });
  });

  it("keeps the supplied cursor when there are no new messages", async () => {
    syncMessages.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/conversations/sync?cursor=19"),
      undefined,
    );

    expect(await response.json()).toEqual({
      messages: [],
      nextCursor: 19,
    });
  });
});
