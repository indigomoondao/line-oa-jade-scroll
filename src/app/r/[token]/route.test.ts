import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSession, verifyAdminToken } = vi.hoisted(() => ({
  createAdminSession: vi.fn(),
  verifyAdminToken: vi.fn(),
}));

vi.mock("@/auth/admin", () => ({
  ADMIN_SESSION_COOKIE_NAME: "jade-scroll-admin-session",
  ADMIN_SESSION_COOKIE_OPTIONS: {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
  },
  createAdminSession,
  verifyAdminToken,
}));

import { GET } from "@/app/r/[token]/route";

function createContext(token: string) {
  return { params: Promise.resolve({ token }) };
}

describe("GET /r/:token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects an invalid token to the access page without creating a session", async () => {
    verifyAdminToken.mockReturnValue(false);

    const response = await GET(
      new Request("http://localhost/r/not-valid"),
      createContext("not-valid"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/access?error=invalid-token",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(createAdminSession).not.toHaveBeenCalled();
  });

  it("exchanges a valid token for an admin session cookie", async () => {
    verifyAdminToken.mockReturnValue(true);
    createAdminSession.mockReturnValue("signed-session");

    const response = await GET(
      new Request("http://localhost/r/valid-token"),
      createContext("valid-token"),
    );

    expect(verifyAdminToken).toHaveBeenCalledWith("valid-token");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin");
    expect(response.headers.get("set-cookie")).toContain(
      "jade-scroll-admin-session=signed-session",
    );
  });
});
