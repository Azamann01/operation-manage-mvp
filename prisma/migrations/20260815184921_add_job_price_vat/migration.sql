-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "vatExempt" BOOLEAN NOT NULL DEFAULT false;
