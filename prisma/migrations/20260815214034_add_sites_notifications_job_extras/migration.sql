-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOB_ASSIGNED', 'JOB_COMPLETED', 'JOB_OVERDUE', 'NOTE_ADDED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "number" SERIAL NOT NULL,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jobId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_jobId_idx" ON "Notification"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_number_key" ON "Job"("number");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

