#!/usr/bin/env node

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "node:path";
import readline from "node:readline";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(rootDir, ".env.local"), quiet: true });
dotenv.config({ path: path.join(rootDir, ".env"), quiet: true });

const roleAliases = new Map([
  ["admin", "super_admin"],
  ["super-admin", "super_admin"],
  ["super_admin", "super_admin"],
  ["security", "bouncer"],
  ["security-admin", "bouncer"],
  ["security_admin", "bouncer"],
  ["bouncer", "bouncer"],
]);

function normalizeRole(role) {
  return roleAliases.get(role.trim().toLowerCase());
}

async function promptHidden(question) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  }

  return new Promise((resolve) => {
    let value = "";

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdout.write(question);

    const onKeypress = (str, key) => {
      if (key.name === "return" || key.name === "enter") {
        process.stdin.setRawMode(false);
        process.stdin.off("keypress", onKeypress);
        process.stdout.write("\n");
        resolve(value);
        return;
      }

      if (key.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }

      if (key.ctrl && key.name === "c") {
        process.stdout.write("\n");
        process.exit(130);
      }

      value += str;
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function readUserInput() {
  const [, , argEmail, argPassword, argRole] = process.argv;

  if (argEmail && argPassword && argRole) {
    return { email: argEmail, password: argPassword, role: argRole };
  }

  if (process.argv.length > 2) {
    console.error(
      "Usage: npm run user:create -- email@example.com password admin|security_admin",
    );
    process.exit(1);
  }

  let rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = await rl.question("Email: ");
  rl.close();

  const password = await promptHidden("Password: ");

  rl = createInterface({ input: process.stdin, output: process.stdout });
  const role = await rl.question("Role (admin/security_admin): ");
  rl.close();

  return { email, password, role };
}

const input = await readUserInput();
const email = input.email.trim().toLowerCase();
const password = input.password;
const role = normalizeRole(input.role);

if (!email || !email.includes("@")) {
  console.error("Enter a valid email address.");
  process.exit(1);
}

if (!password) {
  console.error("Enter a password.");
  process.exit(1);
}

if (!role) {
  console.error("Role must be admin or security_admin.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Add it to .env.local or your Railway environment.");
}

const passwordHash = await bcrypt.hash(password, 12);
const requiresSsl =
  process.env.DATABASE_URL.includes("sslmode=require") || process.env.PGSSLMODE === "require";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
});

try {
  await pool.query(
    `
      insert into app_users (email, password_hash, role)
      values ($1, $2, $3)
      on conflict (email)
      do update set
        password_hash = excluded.password_hash,
        role = excluded.role,
        updated_at = now()
    `,
    [email, passwordHash, role],
  );
  console.log(`Saved ${role} user: ${email}`);
} finally {
  await pool.end();
}
