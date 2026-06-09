-- CreateTable
CREATE TABLE "status_report_submissions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "reference_month" DATE NOT NULL,
    "delivery_email" TEXT NOT NULL,
    "notes" TEXT,
    "submitted_by_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_report_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_report_attachments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_report_submissions_company_id_reference_month_idx" ON "status_report_submissions"("company_id", "reference_month");

-- CreateIndex
CREATE INDEX "status_report_submissions_submitted_at_idx" ON "status_report_submissions"("submitted_at");

-- CreateIndex
CREATE INDEX "status_report_attachments_submission_id_idx" ON "status_report_attachments"("submission_id");

-- AddForeignKey
ALTER TABLE "status_report_submissions" ADD CONSTRAINT "status_report_submissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_report_submissions" ADD CONSTRAINT "status_report_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_report_attachments" ADD CONSTRAINT "status_report_attachments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "status_report_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
