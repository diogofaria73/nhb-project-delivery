import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanies } from '../hooks/use-companies';
import { useCompanyActions } from '../hooks/use-company-actions';
import { CompanyFilters } from '../components/company-filters';
import { CompanyTable } from '../components/company-table';
import { CompanyPagination } from '../components/company-pagination';
import { CompanyFormDialog } from '../components/company-form-dialog';
import { CompanyStatusDialog } from '../components/company-status-dialog';
import { CompanyDetailsDialog } from '../components/company-details-dialog';
import type { CompanyResponse } from '@/types';
import type {
  CreateCompanyFormData,
  UpdateCompanyFormData,
} from '../types/company-form.schema';

export function CompaniesPage() {
  const { t } = useTranslation();
  const {
    companies,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    total,
    refetch,
  } = useCompanies();

  const actions = useCompanyActions({ onSuccess: refetch });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<CompanyResponse | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CompanyResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCompany, setDetailsCompany] = useState<CompanyResponse | null>(null);

  function handleCreate() {
    setSelected(null);
    setFormMode('create');
    setFormOpen(true);
  }

  function handleEdit(company: CompanyResponse) {
    setSelected(company);
    setFormMode('edit');
    setDetailsOpen(false);
    setFormOpen(true);
  }

  function handleView(company: CompanyResponse) {
    setDetailsCompany(company);
    setDetailsOpen(true);
  }

  function handleToggleStatus(company: CompanyResponse) {
    setStatusTarget(company);
    setDetailsOpen(false);
    setStatusOpen(true);
  }

  async function handleFormSubmit(data: CreateCompanyFormData | UpdateCompanyFormData) {
    let success: boolean;
    if (formMode === 'create') {
      const create = data as CreateCompanyFormData;
      success = await actions.createCompany({
        tradeName: create.tradeName,
        legalName: create.legalName,
        cnpj: create.cnpj,
        contactEmail: create.contactEmail,
        contactPhone: create.contactPhone || undefined,
        notes: create.notes || undefined,
      });
    } else {
      const update = data as UpdateCompanyFormData;
      success = await actions.updateCompany(selected!.id, {
        tradeName: update.tradeName,
        legalName: update.legalName,
        contactEmail: update.contactEmail,
        contactPhone: update.contactPhone ?? undefined,
        notes: update.notes ?? undefined,
      });
    }
    if (success) setFormOpen(false);
  }

  async function handleStatusConfirm() {
    if (!statusTarget) return;
    const success = await actions.toggleStatus(statusTarget.id);
    if (success) setStatusOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t('companies.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('companies.description')}</p>
      </div>

      <CompanyFilters
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        isActive={filters.isActive}
        onStatusChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}
        onCreateClick={handleCreate}
      />

      <CompanyTable
        companies={companies}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onToggleStatus={handleToggleStatus}
      />

      <CompanyPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        company={selected}
        loading={actions.loading}
        onSubmit={handleFormSubmit}
      />

      <CompanyStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        company={statusTarget}
        loading={actions.loading}
        onConfirm={handleStatusConfirm}
      />

      <CompanyDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        company={detailsCompany}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
