import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { ToggleActiveButton } from "@/components/employees/toggle-active-button";
import { initials, avatarTints } from "@/lib/utils";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const employees = await db.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} team member{employees.length === 1 ? "" : "s"}
          </p>
        </div>
        <EmployeeFormDialog />
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <UserCog className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No employees yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your team so you can assign them to jobs.
          </p>
          <EmployeeFormDialog />
        </div>
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned jobs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e, i) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTints[i % avatarTints.length]}`}
                      >
                        {initials(e.name)}
                      </div>
                      {e.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.email}</TableCell>
                  <TableCell className="text-muted-foreground">{e.jobTitle || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e._count.assignments}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.active ? "default" : "outline"}>
                      {e.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EmployeeFormDialog employee={e} />
                      <ToggleActiveButton id={e.id} active={e.active} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
