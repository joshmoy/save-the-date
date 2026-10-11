import { redirect } from "next/navigation";
import { AuthHeader } from "../../src/components/auth/AuthHeader";
import { HallPassScanner } from "../../src/components/scanner/HallPassScanner";
import { canAccessRole, getCurrentSession } from "../../src/lib/auth";

export default async function ScannerPage() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin", "bouncer"])) {
    redirect("/admin/login?next=/scanner");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <AuthHeader session={session} />
      <HallPassScanner />
    </div>
  );
}
