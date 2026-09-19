import "server-only";

import { neon } from "@neondatabase/serverless";
import { config } from "@/config/config";

export const sql = neon(config.database.url);
