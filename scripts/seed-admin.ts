/**
 * One-time admin seed script.
 * Run: npm run seed:admin
 * Requires SUPABASE_SERVICE_ROLE_KEY and ADMIN_INITIAL_PASSWORD in .env.local
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_INITIAL_PASSWORD;
const domain = process.env.AUTH_EMAIL_DOMAIN ?? "expenses.local";

if (!url || !serviceKey || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_INITIAL_PASSWORD");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = `cfi@${domain}`;

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email?.toLowerCase() === email);

  let userId: string;
  if (found) {
    userId = found.id;
    await admin.auth.admin.updateUserById(userId, {
      password,
      app_metadata: { role: "admin" },
    });
    console.log("Updated existing CFI admin user");
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "CFI Administrator" },
      app_metadata: { role: "admin" },
    });
    if (error || !data.user) {
      console.error("Failed to create admin:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Created CFI admin user");
  }

  await admin.from("profiles").upsert({
    id: userId,
    full_name: "CFI Administrator",
    role: "admin",
    budget_amount: 0,
  });

  console.log("Admin profile synced. Login: CFI / (password from ADMIN_INITIAL_PASSWORD)");
}

main();
