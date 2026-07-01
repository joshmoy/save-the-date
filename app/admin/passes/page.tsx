import { redirect } from "next/navigation";
import { AuthHeader } from "../../../src/components/auth/AuthHeader";
import { PassDashboard } from "../../../src/components/admin/PassDashboard";
import { canAccessRole, getCurrentSession } from "../../../src/lib/auth";
import { getTicketAvailability, listHallPasses } from "../../../src/lib/hallPasses";

export default async function AdminPassesPage() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    redirect("/admin/login");
  }

  const [passes, ticketAvailability] = await Promise.all([
    listHallPasses(),
    getTicketAvailability(),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <AuthHeader session={session} />
      <PassDashboard initialPasses={passes} initialTicketAvailability={ticketAvailability} />
    </div>
  );
}
