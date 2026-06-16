-- AlterTable: store the "Consolidado Anual" portfolio percent read directly
-- from the uploaded spreadsheet (BI sheet, cell L2).
ALTER TABLE "project_imports"
  ADD COLUMN "annual_consolidated_percent" DOUBLE PRECISION;
