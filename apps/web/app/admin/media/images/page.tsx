import { redirect } from "next/navigation";
import { CloudinaryImageUploader } from "../../../../src/components/admin/CloudinaryImageUploader";
import { AuthHeader } from "../../../../src/components/auth/AuthHeader";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";

export default async function AdminMediaImagesPage() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    redirect("/admin/login?next=/admin/media/images");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <AuthHeader session={session} />
      <CloudinaryImageUploader />
    </div>
  );
}
