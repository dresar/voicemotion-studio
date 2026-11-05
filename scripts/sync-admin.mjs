import { neon } from "@neondatabase/serverless";
import * as fs from "fs";

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1].trim()] = val;
    }
  }
} catch (e) {}

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

async function main() {
  await sql`DELETE FROM users WHERE email IN ('admin@example.com', 'demo@voicemotion.studio');`;
  const now = new Date().toISOString();
  await sql`
    INSERT INTO users (id, email, name, avatar, provider, plan, credits, project_quota, role, referral_code, created_at, disabled)
    VALUES 
      ('88dbe808-5f6b-4c7e-9599-ca8677f2aaf9', 'admin@example.com', 'Admin', '', 'email', 'pro', 100, 999, 'admin', '42720582', ${now}, 0),
      ('bda9f987-259b-400a-9131-e18cbdea5f8b', 'demo@voicemotion.studio', 'Demo Kreator', '', 'email', 'trial', 5, 3, 'user', 'cf43f65b', ${now}, 0);
  `;
  const users = await sql`SELECT id, email, role, credits FROM users;`;
  console.log("All synced users in Neon:", users);
}

main().catch(console.error);
