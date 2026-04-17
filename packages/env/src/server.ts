import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

// Load in priority order: root .env.local → local .env.local → local .env
// Later calls are no-ops for vars already set (dotenv never overwrites)
dotenv.config({ path: "../../.env.local" });
dotenv.config({ path: ".env.local" });
dotenv.config();

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
