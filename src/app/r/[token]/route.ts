import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_OPTIONS,
  createAdminSession,
  verifyAdminToken,
} from "@/auth/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function createRedirect(request: Request, pathname: string): NextResponse {
  const response = NextResponse.redirect(new URL(pathname, request.url));

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { token } = await params;

  if (!verifyAdminToken(token)) {
    return createRedirect(request, "/access?error=invalid-token");
  }

  const response = createRedirect(request, "/admin");

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSession(),
    ADMIN_SESSION_COOKIE_OPTIONS,
  );

  return response;
}
