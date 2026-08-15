import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { SiteFormDialog } from "@/components/sites/site-form-dialog";
import { DeleteSiteButton } from "@/components/sites/delete-site-button";
import { statusVariant, priorityVariant } from "@/lib/job-badges";
import { formatJobNumber } from "@/lib/jobs";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { assignments: { include: { employee: true } } },
      },
      sites: { orderBy: { name: "asc" } },
    },
  });

  if (!customer) notFound();

  const ratedJobs = customer.jobs.filter((j) => j.rating != null);
  const avgRating =
    ratedJobs.length > 0
      ? ratedJobs.reduce((sum, j) => sum + (j.rating ?? 0), 0) / ratedJobs.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/customers"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
              {customer.industry && <Badge variant="outline">{customer.industry}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{customer.address}</p>
          </div>
          <CustomerFormDialog customer={customer} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{customer.contactName || "—"}</p>
            <p className="text-muted-foreground">{customer.email || "—"}</p>
            <p className="text-muted-foreground">{customer.phone || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{customer.jobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratedJobs.length > 0 ? (
              <p className="text-2xl font-semibold">
                {avgRating.toFixed(1)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({ratedJobs.length})
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No ratings yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{customer.notes || "No notes."}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Sites</h2>
          <SiteFormDialog customerId={customer.id} />
        </div>
        {customer.sites.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            No sites added yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {customer.sites.map((site) => (
              <div
                key={site.id}
                className="flex items-start justify-between gap-2 rounded-lg border bg-background p-3"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{site.name}</p>
                    {site.address && (
                      <p className="text-xs text-muted-foreground">{site.address}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <SiteFormDialog customerId={customer.id} site={site} />
                  <DeleteSiteButton id={site.id} customerId={customer.id} name={site.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Job history</h2>
        {customer.jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            No jobs for this customer yet.
          </p>
        ) : (
          <div className="space-y-2">
            {customer.jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between rounded-lg border bg-background p-4 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
              >
                <div>
                  <p className="font-medium">
                    <span className="mr-2 font-mono text-xs font-normal text-muted-foreground">
                      {formatJobNumber(job.number)}
                    </span>
                    {job.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.assignments.length > 0
                      ? job.assignments.map((a) => a.employee.name).join(", ")
                      : "Unassigned"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={priorityVariant(job.priority)}>{job.priority}</Badge>
                  <Badge variant={statusVariant(job.status)}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
