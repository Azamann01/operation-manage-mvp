import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import { Users, ArrowRight } from "lucide-react";
import { OPEN_STATUSES } from "@/lib/jobs";

const avatarTints = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          sites: true,
          jobs: { where: { status: { in: OPEN_STATUSES } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Customer records
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Sites, contacts and current work in one place.
          </p>
        </div>
        <CustomerFormDialog />
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No customers yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first customer to start creating jobs.
          </p>
          <CustomerFormDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c, i) => (
            <div
              key={c.id}
              className="group flex flex-col rounded-xl border bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:bg-indigo-950/10"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${avatarTints[i % avatarTints.length]}`}
                >
                  {initials(c.name)}
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <CustomerFormDialog customer={c} />
                  <DeleteCustomerButton id={c.id} name={c.name} />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-medium">{c.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.industry || "No industry set"}
                </p>
              </div>

              <div className="mt-4 space-y-1.5 border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Primary contact</span>
                  <span className="font-medium">{c.contactName || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sites</span>
                  <Badge variant="secondary">{c._count.sites}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open jobs</span>
                  <Badge variant="secondary">{c._count.jobs}</Badge>
                </div>
              </div>

              <Link
                href={`/admin/customers/${c.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View customer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
