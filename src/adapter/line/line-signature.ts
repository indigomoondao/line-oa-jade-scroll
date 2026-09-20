import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { config } from "@/config/config";

export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", config.line.channelSecret)
    .update(rawBody, "utf8")
    .digest();

  const receivedSignature = Buffer.from(signature, "base64");

  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }

  return timingSafeEqual(expectedSignature, receivedSignature);
}
