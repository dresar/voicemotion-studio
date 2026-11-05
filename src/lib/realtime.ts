import { createRealtime, rawSql } from "@neon/realtime/server";

const secret = process.env.NEON_REALTIME_SECRET || "";

export const realtime = createRealtime({
  secret,
  db: "neondb",
});

export interface LiveProject {
  id: string;
  user_id: string;
  title: string;
  stage: string;
  config: string | null;
  created_at: string;
  updated_at: string;
}

export function usersLiveQuery() {
  return rawSql<{ id: string; email: string; name: string | null; role: string; plan: string; credits: number }>(
    "SELECT id, email, name, role, plan, credits FROM users ORDER BY created_at DESC"
  );
}

export function projectsLiveQuery(userId?: string) {
  if (userId) {
    return rawSql<LiveProject>(
      "SELECT id, user_id, title, stage, config, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );
  }
  return rawSql<LiveProject>(
    "SELECT id, user_id, title, stage, config, created_at, updated_at FROM projects ORDER BY updated_at DESC"
  );
}

export async function sealUsersQuery() {
  return await realtime.seal({ query: usersLiveQuery() });
}

export async function sealProjectsQuery(userId?: string) {
  return await realtime.seal({ query: projectsLiveQuery(userId) });
}
