import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QuickCreateJob } from "@/components/jobs/quick-create-job";
import { getNotifications } from "@/lib/actions/notifications";
import { getCustomersList, getSitesList } from "@/lib/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [notifications, customers, sites] = await Promise.all([
    getNotifications(),
    getCustomersList(),
    getSitesList(),
  ]);

  return (
    <DashboardShell
      variant="admin"
      user={{
        name: session.user.name ?? "Admin",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      notifications={notifications}
      quickCreate={<QuickCreateJob customers={customers} sites={sites} />}
    >
      {children}
    </DashboardShell>
  );
}
