import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "";

if (!connectionString) {
  console.warn("Neon DATABASE_URL is not configured.");
}

export const sql = neon(connectionString);

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: string;
  plan: string;
  credits: number;
  project_quota: number;
  role: string;
  created_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  title: string;
  stage: string;
  config: string | null;
  created_at: string;
  updated_at: string;
}

export async function getDbUsers(): Promise<DbUser[]> {
  const rows = await sql`
    SELECT id, email, name, avatar, provider, plan, credits, project_quota, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return rows as DbUser[];
}

export async function getDbProjects(userId?: string): Promise<DbProject[]> {
  if (userId) {
    const rows = await sql`
      SELECT id, user_id, title, stage, config, created_at, updated_at
      FROM projects
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
    return rows as DbProject[];
  }
  const rows = await sql`
    SELECT id, user_id, title, stage, config, created_at, updated_at
    FROM projects
    ORDER BY updated_at DESC
  `;
  return rows as DbProject[];
}
