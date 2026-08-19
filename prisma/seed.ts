import { PrismaClient, JobStatus, JobPriority, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // This script wipes every table before reseeding. Only ever run it against
  // a demo/staging database — require the same DEMO_MODE flag that gates the
  // demo login accounts, so a stray `npm run db:seed` against production
  // can't silently delete real customer data.
  if (process.env.DEMO_MODE !== "true") {
    console.error(
      "Refusing to seed: this script deletes ALL existing data before reseeding.\n" +
        "Set DEMO_MODE=true in the environment only when targeting a demo/staging database."
    );
    process.exit(1);
  }

  await db.notification.deleteMany();
  await db.jobActivity.deleteMany();
  await db.jobAssignment.deleteMany();
  await db.job.deleteMany();
  await db.site.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@operflow.app" },
    update: {},
    create: {
      name: "Sam Whitfield",
      email: "admin@operflow.app",
      passwordHash,
      role: "ADMIN",
      jobTitle: "Operations Manager",
    },
  });

  const engineers = await Promise.all(
    [
      { name: "Jamie Carter", email: "jamie@operflow.app", jobTitle: "Field Engineer" },
      { name: "Priya Shah", email: "priya@operflow.app", jobTitle: "Field Engineer" },
      { name: "Liam O'Connor", email: "liam@operflow.app", jobTitle: "Technician" },
    ].map((u) =>
      db.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash, role: "EMPLOYEE" },
      })
    )
  );

  const customerDefs = [
    {
      name: "Thistle Retail Group",
      industry: "Property management",
      contactName: "Alex Morgan",
      email: "alex.morgan@thistleretail.co.uk",
      phone: "020 7946 0123",
      address: "45 Baker Street, London, W1U 8EW",
      sites: [
        { name: "Baker Street HQ", address: "45 Baker Street, London, W1U 8EW" },
        { name: "Canary Wharf Store", address: "1 Canada Square, London, E14 5AB" },
      ],
    },
    {
      name: "Sunrise Apartments Ltd",
      industry: "Residential property",
      contactName: "Charlie Dunn",
      email: "charlie.dunn@sunriseapts.co.uk",
      phone: "0161 496 0456",
      address: "12 Deansgate, Manchester, M3 2BW",
      sites: [{ name: "Deansgate Block A", address: "12 Deansgate, Manchester, M3 2BW" }],
    },
    {
      name: "GreenField Foods",
      industry: "Light manufacturing",
      contactName: "Robin Blake",
      email: "robin.blake@greenfieldfoods.co.uk",
      phone: "0121 496 0789",
      address: "8 Colmore Row, Birmingham, B3 2QD",
      sites: [
        { name: "Colmore Row Site", address: "8 Colmore Row, Birmingham, B3 2QD" },
        { name: "Digbeth Cold Store", address: "22 Digbeth, Birmingham, B5 6DR" },
      ],
    },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const { sites, ...customerData } = c;
    const customer = await db.customer.create({ data: customerData });
    const createdSites = await Promise.all(
      sites.map((s) => db.site.create({ data: { ...s, customerId: customer.id } }))
    );
    customers.push({ ...customer, sites: createdSites });
  }

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);

  const jobDefs: Array<{
    title: string;
    description: string;
    customer: number;
    site?: number;
    status: JobStatus;
    priority: JobPriority;
    assignees: number[];
    scheduledDaysFromNow: number;
    dueDaysFromNow: number | null;
    price: number;
    vatExempt?: boolean;
    rating?: number;
    createdHoursAgo?: number;
    completedHoursAgo?: number;
  }> = [
    { title: "HVAC unit servicing", description: "Quarterly maintenance on rooftop HVAC units", customer: 0, site: 0, status: "IN_PROGRESS", priority: "HIGH", assignees: [0], scheduledDaysFromNow: 0, dueDaysFromNow: 1, price: 480 },
    { title: "Electrical panel inspection", description: "Annual safety inspection of main panel", customer: 1, site: 0, status: "PENDING", priority: "MEDIUM", assignees: [], scheduledDaysFromNow: 3, dueDaysFromNow: 4, price: 220 },
    { title: "Cold storage repair", description: "Compressor making noise, needs diagnosis", customer: 2, site: 1, status: "ASSIGNED", priority: "HIGH", assignees: [1, 2], scheduledDaysFromNow: 1, dueDaysFromNow: 0, price: 650 },
    { title: "Plumbing leak fix", description: "Leak reported in basement utility room", customer: 1, site: 0, status: "COMPLETED", priority: "MEDIUM", assignees: [0], scheduledDaysFromNow: -2, dueDaysFromNow: -2, price: 175, rating: 5, createdHoursAgo: 72, completedHoursAgo: 60 },
    { title: "Generator load test", description: "Monthly backup generator test run", customer: 0, site: 1, status: "PENDING", priority: "LOW", assignees: [], scheduledDaysFromNow: 5, dueDaysFromNow: 6, price: 120, vatExempt: true },
    { title: "Fire alarm fault", description: "Panel reporting zone 3 fault, needs urgent attention", customer: 2, site: 0, status: "ASSIGNED", priority: "HIGH", assignees: [2], scheduledDaysFromNow: -1, dueDaysFromNow: -1, price: 340 },
    { title: "Loading bay door repair", description: "Roller door jammed at Digbeth cold store", customer: 2, site: 1, status: "COMPLETED", priority: "MEDIUM", assignees: [1], scheduledDaysFromNow: -5, dueDaysFromNow: -4, price: 260, rating: 4, createdHoursAgo: 120, completedHoursAgo: 72 },
    { title: "Lift maintenance check", description: "Routine passenger lift service", customer: 0, site: 1, status: "COMPLETED", priority: "LOW", assignees: [0], scheduledDaysFromNow: -6, dueDaysFromNow: -5, price: 310, rating: 5, createdHoursAgo: 144, completedHoursAgo: 132 },
  ];

  for (const jd of jobDefs) {
    const job = await db.job.create({
      data: {
        title: jd.title,
        description: jd.description,
        customerId: customers[jd.customer].id,
        siteId: jd.site != null ? customers[jd.customer].sites[jd.site]?.id : null,
        status: jd.status,
        priority: jd.priority,
        scheduledDate: new Date(Date.now() + jd.scheduledDaysFromNow * 86400000),
        dueDate: jd.dueDaysFromNow != null ? new Date(Date.now() + jd.dueDaysFromNow * 86400000) : null,
        price: jd.price,
        vatExempt: jd.vatExempt ?? false,
        rating: jd.rating ?? null,
        createdById: admin.id,
        ...(jd.createdHoursAgo != null ? { createdAt: hoursAgo(jd.createdHoursAgo) } : {}),
        ...(jd.completedHoursAgo != null
          ? { updatedAt: hoursAgo(jd.completedHoursAgo), completedAt: hoursAgo(jd.completedHoursAgo) }
          : {}),
      },
    });

    for (const idx of jd.assignees) {
      await db.jobAssignment.create({
        data: { jobId: job.id, employeeId: engineers[idx].id },
      });
    }

    await db.jobActivity.create({
      data: {
        jobId: job.id,
        authorId: admin.id,
        type: ActivityType.NOTE,
        description: `Job "${jd.title}" created for ${customers[jd.customer].name}.`,
      },
    });

    if (jd.status !== "PENDING") {
      await db.jobActivity.create({
        data: {
          jobId: job.id,
          authorId: jd.assignees.length ? engineers[jd.assignees[0]].id : admin.id,
          type: ActivityType.STATUS_CHANGE,
          description: `Status changed to ${jd.status}.`,
        },
      });
    }
  }

  console.log("Seed complete:", { admin: admin.email, engineers: engineers.map((e) => e.email) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
