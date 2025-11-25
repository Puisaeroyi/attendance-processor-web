-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "leave_requests" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "leave_requests" ADD COLUMN "archived_by" TEXT;
ALTER TABLE "leave_requests" ADD COLUMN "delete_reason" TEXT;
ALTER TABLE "leave_requests" ADD COLUMN "deleted_at" DATETIME;
ALTER TABLE "leave_requests" ADD COLUMN "deleted_by" TEXT;

-- CreateIndex
CREATE INDEX "leave_requests_archived_at_idx" ON "leave_requests"("archived_at");

-- CreateIndex
CREATE INDEX "leave_requests_deleted_at_idx" ON "leave_requests"("deleted_at");

-- CreateIndex
CREATE INDEX "leave_requests_status_archived_at_idx" ON "leave_requests"("status", "archived_at");
