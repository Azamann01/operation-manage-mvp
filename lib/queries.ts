import { cache } from "react";
import { db } from "@/lib/db";

// Shared across app/admin/layout.tsx (job-creation dialog in the navbar) and
// any admin page that renders its own job-creation dialog (e.g. the Jobs
// page) — cache() dedupes the identical query within a single request.
export const getCustomersList = cache(() =>
  db.customer.findMany({ orderBy: { name: "asc" } })
);

export const getSitesList = cache(() => db.site.findMany({ orderBy: { name: "asc" } }));
