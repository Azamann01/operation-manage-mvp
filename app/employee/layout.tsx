import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getNotifications } from "@/lib/actions/notifications";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await getNotifications();

  return (
    <DashboardShell
      variant="employee"
      user={{
        name: session.user.name ?? "Employee",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
