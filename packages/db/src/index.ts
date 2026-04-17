import { neon } from "@neondatabase/serverless";
import { env } from "@onivue-invoice/env/server";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export * from "./schema/index.js";
