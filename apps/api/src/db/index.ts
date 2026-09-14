import { loadEnv } from "../lib/env";
loadEnv();

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "./notes.db";
const sqlite = new Database(dbPath, { create: true });

// Enable SQLite WAL mode and foreign keys enforcement
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
export const rawSqlite = sqlite;
