import { JobFormDialog } from "./job-form-dialog";

export function QuickCreateJob({
  customers,
  sites,
}: {
  customers: { id: string; name: string }[];
  sites: { id: string; name: string; customerId: string }[];
}) {
  return <JobFormDialog customers={customers} sites={sites} variant="compact" />;
}
