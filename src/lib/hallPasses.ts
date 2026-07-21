import crypto from "node:crypto";
import { getDb, query } from "./db";
import type { AuthSession } from "./auth";
import {
  normalizeHallPassPageSize,
  type HallPassListParams,
  type HallPassListTab,
  type HallPassPageSize,
  type HallPassStatusFilter,
} from "./hallPassPaging";

export type { HallPassListParams, HallPassListTab, HallPassPageSize, HallPassStatusFilter };
export { HALL_PASS_PAGE_SIZES } from "./hallPassPaging";

export type HallPass = {
  id: string;
  ticket_number: number;
  token: string;
  guest_name: string | null;
  invite_from: string | null;
  created_by: string | null;
  created_at: Date;
  used_at: Date | null;
  used_by: string | null;
  invalidated_at: Date | null;
  invalidated_by: string | null;
  email_recipient: string | null;
  email_status: "not_sent" | "sent" | "failed";
  email_sent_at: Date | null;
  email_error: string | null;
};

export type HallPassRedeemStatus = "valid" | "used" | "invalid";

export type HallPassRedeemResult = {
  id: string | null;
  ticket_number: number | null;
  guest_name: string | null;
  status: HallPassRedeemStatus;
  used_at: Date | null;
};

export type ScanAttempt = {
  id: string;
  hall_pass_id: string | null;
  token: string;
  scanner_email: string | null;
  result: HallPassRedeemStatus;
  scanned_at: Date;
};

export type TicketAvailability = {
  ticket_limit: number | null;
  issued_count: number;
  remaining_count: number | null;
};

function createReadableToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  const characters = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);

  return `HP-${characters.slice(0, 4).join("")}-${characters.slice(4, 8).join("")}`;
}

export async function redeemHallPass(
  token: string,
  scannerName?: string,
): Promise<HallPassRedeemResult> {
  const result = await query<HallPassRedeemResult>(
    "select * from redeem_hall_pass($1, $2) limit 1",
    [token.toUpperCase(), scannerName ?? null],
  );

  const redeemed = result.rows[0];

  if (!redeemed) {
    return {
      id: null,
      ticket_number: null,
      guest_name: null,
      status: "invalid",
      used_at: null,
    };
  }

  return redeemed;
}

export async function logScanAttempt(
  token: string,
  scannerEmail: string | null,
  result: HallPassRedeemResult,
) {
  await query(
    `
      insert into scan_attempts (hall_pass_id, token, scanner_email, result)
      values ($1, $2, $3, $4)
    `,
    [result.id, token.toUpperCase(), scannerEmail, result.status],
  );
}

export async function listRecentScanAttempts(limit = 50) {
  const result = await query<ScanAttempt>(
    `
      select id, hall_pass_id, token, scanner_email, result, scanned_at
      from scan_attempts
      order by scanned_at desc
      limit $1
    `,
    [limit],
  );

  return result.rows;
}

export async function createHallPass(guestName: string, inviteFrom: string | null, createdBy: AuthSession) {
  const passes = await createHallPasses([guestName], inviteFrom, createdBy);

  return passes[0] ?? null;
}

export async function createHallPasses(
  guestNames: string[],
  inviteFrom: string | null,
  createdBy: AuthSession,
) {
  const normalizedGuestNames = guestNames.map((name) => name.trim());

  if (normalizedGuestNames.length === 0) {
    return [];
  }

  const client = await getDb().connect();

  try {
    await client.query("begin");

    const settingsResult = await client.query<{ ticket_limit: number | null }>(
      "select ticket_limit from ticket_settings where id = true for update",
    );
    const configuredLimit = settingsResult.rows[0]?.ticket_limit ?? null;

    if (configuredLimit !== null) {
      const issuedResult = await client.query<{ issued_count: number }>(
        "select count(*)::int as issued_count from hall_passes where invalidated_at is null",
      );
      const issuedCount = issuedResult.rows[0]?.issued_count ?? 0;

      if (issuedCount + normalizedGuestNames.length > configuredLimit) {
        await client.query("rollback");
        return [];
      }
    }

    const passes: HallPass[] = [];

    for (const guestName of normalizedGuestNames) {
      let createdPass: HallPass | null = null;

      for (let attempt = 0; attempt < 5 && !createdPass; attempt += 1) {
        const token = createReadableToken().toUpperCase();
        const result = await client.query<HallPass>(
          `
            insert into hall_passes (token, guest_name, invite_from, created_by)
            values ($1, $2, $3, $4)
            on conflict (token) do nothing
            returning id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
          `,
          [token, guestName || null, inviteFrom?.trim() || null, createdBy.email],
        );

        createdPass = result.rows[0] ?? null;
      }

      if (!createdPass) {
        throw new Error("Could not generate a unique hall pass token.");
      }

      passes.push(createdPass);
    }

    await client.query("commit");

    return passes;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function getTicketAvailability() {
  const result = await query<TicketAvailability>(`
    select
      ts.ticket_limit,
      count(hp.id) filter (where hp.invalidated_at is null)::int as issued_count,
      case
        when ts.ticket_limit is null then null
        else greatest(
          ts.ticket_limit - count(hp.id) filter (where hp.invalidated_at is null),
          0
        )
      end as remaining_count
    from ticket_settings ts
    left join hall_passes hp on true
    where ts.id = true
    group by ts.ticket_limit
  `);

  return (
    result.rows[0] ?? {
      ticket_limit: null,
      issued_count: 0,
      remaining_count: null,
    }
  );
}

export async function updateTicketLimit(ticketLimit: number | null, updatedBy: AuthSession) {
  await query(
    `
      update ticket_settings
      set ticket_limit = $1,
          updated_by = $2,
          updated_at = now()
      where id = true
    `,
    [ticketLimit, updatedBy.email],
  );

  return getTicketAvailability();
}

export type HallPassListResult = {
  passes: HallPass[];
  total: number;
  page: number;
  limit: HallPassPageSize;
  totalPages: number;
  activeCount: number;
  invalidatedCount: number;
};

function buildHallPassFilters(params: {
  tab: HallPassListTab;
  status: HallPassStatusFilter;
  search: string;
}) {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (params.tab === "active") {
    conditions.push("invalidated_at is null");

    if (params.status === "unused") {
      conditions.push("used_at is null");
    } else if (params.status === "used") {
      conditions.push("used_at is not null");
    }
  } else {
    conditions.push("invalidated_at is not null");
  }

  if (params.search) {
    values.push(`%${params.search}%`);
    const index = values.length;
    conditions.push(`(
      coalesce(guest_name, '') ilike $${index}
      or token ilike $${index}
      or coalesce(invite_from, '') ilike $${index}
      or coalesce(email_recipient, '') ilike $${index}
      or coalesce(created_by, '') ilike $${index}
      or ticket_number::text ilike $${index}
    )`);
  }

  return {
    whereClause: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    values,
  };
}

export async function listHallPasses(params: HallPassListParams = {}): Promise<HallPassListResult> {
  const limit = normalizeHallPassPageSize(params.limit);
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const tab = params.tab === "invalidated" ? "invalidated" : "active";
  const status = params.status === "unused" || params.status === "used" ? params.status : "all";
  const search = params.search?.trim() ?? "";
  const offset = (page - 1) * limit;
  const { whereClause, values } = buildHallPassFilters({ tab, status, search });

  const [passesResult, totalResult, countsResult] = await Promise.all([
    query<HallPass>(
      `
        select id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
        from hall_passes
        ${whereClause}
        order by created_at desc
        limit $${values.length + 1}
        offset $${values.length + 2}
      `,
      [...values, limit, offset],
    ),
    query<{ total: number }>(
      `
        select count(*)::int as total
        from hall_passes
        ${whereClause}
      `,
      values,
    ),
    query<{ active_count: number; invalidated_count: number }>(`
      select
        count(*) filter (where invalidated_at is null)::int as active_count,
        count(*) filter (where invalidated_at is not null)::int as invalidated_count
      from hall_passes
    `),
  ]);

  const total = totalResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    passes: passesResult.rows,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
    activeCount: countsResult.rows[0]?.active_count ?? 0,
    invalidatedCount: countsResult.rows[0]?.invalidated_count ?? 0,
  };
}

export async function invalidateHallPass(passId: string, invalidatedBy: AuthSession) {
  const result = await query<HallPass>(
    `
      update hall_passes
      set invalidated_at = coalesce(invalidated_at, now()),
          invalidated_by = coalesce(invalidated_by, $2)
      where id = $1
      returning id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
    `,
    [passId, invalidatedBy.email],
  );

  return result.rows[0] ?? null;
}

export async function invalidateAllHallPasses(invalidatedBy: AuthSession) {
  const result = await query<HallPass>(
    `
      update hall_passes
      set invalidated_at = coalesce(invalidated_at, now()),
          invalidated_by = coalesce(invalidated_by, $1)
      where invalidated_at is null
      returning id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
    `,
    [invalidatedBy.email],
  );

  return result.rows;
}

export async function getHallPassById(passId: string) {
  const result = await query<HallPass>(
    `
      select id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
      from hall_passes
      where id = $1
      limit 1
    `,
    [passId],
  );

  return result.rows[0] ?? null;
}

export async function updatePassEmailDelivery(
  passIds: string[],
  delivery: {
    recipient: string;
    status: "sent" | "failed";
    error?: string | null;
  },
) {
  if (passIds.length === 0) return [];

  const result = await query<HallPass>(
    `
      update hall_passes
      set email_recipient = $2,
          email_status = $3,
          email_sent_at = case when $3 = 'sent' then now() else email_sent_at end,
          email_error = $4
      where id = any($1::uuid[])
      returning id, ticket_number, token, guest_name, invite_from, created_by, created_at, used_at, used_by, invalidated_at, invalidated_by, email_recipient, email_status, email_sent_at, email_error
    `,
    [passIds, delivery.recipient, delivery.status, delivery.error ?? null],
  );

  return result.rows;
}
