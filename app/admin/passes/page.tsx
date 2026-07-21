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

  const [passList, ticketAvailability] = await Promise.all([
    listHallPasses({ page: 1, limit: 50, tab: "active" }),
    getTicketAvailability(),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <AuthHeader session={session} />
      <PassDashboard
        initialPasses={passList.passes}
        initialTicketAvailability={ticketAvailability}
        initialPagination={{
          page: passList.page,
          limit: passList.limit,
          total: passList.total,
          totalPages: passList.totalPages,
          activeCount: passList.activeCount,
          invalidatedCount: passList.invalidatedCount,
        }}
      />
    </div>
  );
}
