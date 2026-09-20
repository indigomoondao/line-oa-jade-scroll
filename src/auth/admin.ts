import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { config } from "@/config/config";

export const ADMIN_SESSION_COOKIE_NAME = "jade-scroll-admin-session";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const SESSION_VERSION = "v1";

export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

export function verifyAdminToken(token: string): boolean {
  return valuesMatch(token, config.admin.accessToken);
}

export function createAdminSession(): string {
  const expiresAtSeconds = Math.floor(
    (Date.now() + SESSION_DURATION_SECONDS * 1_000) / 1_000,
  );
  const nonce = randomBytes(16).toString("base64url");
  const unsignedValue = [SESSION_VERSION, expiresAtSeconds, nonce].join(".");

  return `${unsignedValue}.${sign(unsignedValue)}`;
}

export function verifyAdminSession(session: string | undefined): boolean {
  if (!session) {
    return false;
  }

  const [version, expiresAt, nonce, signature, ...rest] = session.split(".");

  if (
    version !== SESSION_VERSION ||
    !expiresAt ||
    !nonce ||
    !signature ||
    rest.length > 0 ||
    !/^[A-Za-z0-9_-]{22}$/.test(nonce)
  ) {
    return false;
  }

  const expiresAtSeconds = Number(expiresAt);

  if (
    !Number.isSafeInteger(expiresAtSeconds) ||
    expiresAtSeconds * 1_000 <= Date.now()
  ) {
    return false;
  }

  return valuesMatch(signature, sign([version, expiresAt, nonce].join(".")));
}

function sign(value: string): string {
  return createHmac("sha256", config.session.secret)
    .update(value, "utf8")
    .digest("base64url");
}

function valuesMatch(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");

  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}
