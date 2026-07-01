import "server-only";

import bcrypt from "bcryptjs";
import { query } from "./db";
import type { AppRole } from "./auth";

export type AppUser = {
  id: string;
  email: string;
  password_hash: string;
  role: AppRole;
};

export async function findUserByEmail(email: string) {
  const result = await query<AppUser>(
    `
      select id, email, password_hash, role
      from app_users
      where lower(email) = lower($1)
      limit 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function verifyUserPassword(user: AppUser, password: string) {
  return bcrypt.compare(password, user.password_hash);
}
