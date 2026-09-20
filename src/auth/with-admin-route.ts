import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "@/auth/admin";

type AdminRouteHandler<Context> = (
  request: Request,
  context: Context,
) => Response | Promise<Response>;

export function withAdminRoute<Context>(
  handler: AdminRouteHandler<Context>,
): AdminRouteHandler<Context> {
  return async (request, context) => {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!verifyAdminSession(session)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(request, context);
  };
}
