import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),

  LINE_OA_NAME: z.string().trim().min(1).default("Jade Scroll"),

  LINE_CHANNEL_SECRET: z
    .string()
    .trim()
    .min(1, "LINE_CHANNEL_SECRET is required"),

  LINE_CHANNEL_ACCESS_TOKEN: z
    .string()
    .trim()
    .min(1, "LINE_CHANNEL_ACCESS_TOKEN is required"),

  ADMIN_ACCESS_TOKEN: z
    .string()
    .trim()
    .min(22, "ADMIN_ACCESS_TOKEN must be at least 22 characters"),

  SESSION_SECRET: z
    .string()
    .trim()
    .min(43, "SESSION_SECRET must be at least 43 characters"),
});

const env = envSchema.parse(process.env);

export const config = {
  database: {
    url: env.DATABASE_URL,
  },

  line: {
    oaName: env.LINE_OA_NAME,
    channelSecret: env.LINE_CHANNEL_SECRET,
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  },

  admin: {
    accessToken: env.ADMIN_ACCESS_TOKEN,
  },

  session: {
    secret: env.SESSION_SECRET,
  },
} as const;
