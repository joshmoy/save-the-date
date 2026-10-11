import { redirect } from "next/navigation";
import { LoginForm } from "../../../src/components/admin/LoginForm";
import { getCurrentSession } from "../../../src/lib/auth";

function getSafeNextPath(nextPath: string | string[] | undefined) {
  const value = Array.isArray(nextPath) ? nextPath[0] : nextPath;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await getCurrentSession();
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next);

  if (session) {
    redirect(nextPath ?? (session.role === "bouncer" ? "/scanner" : "/admin/passes"));
  }

  return <LoginForm nextPath={nextPath} />;
}
