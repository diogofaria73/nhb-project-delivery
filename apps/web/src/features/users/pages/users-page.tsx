import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../hooks/use-users';
import { useUserActions } from '../hooks/use-user-actions';
import { UserFilters } from '../components/user-filters';
import { UserTable } from '../components/user-table';
import { UserPagination } from '../components/user-pagination';
import { UserFormDialog } from '../components/user-form-dialog';
import { UserStatusDialog } from '../components/user-status-dialog';
import type { User } from '@/types';
import type { CreateUserFormData, UpdateUserFormData } from '../types/user-form.schema';

export function UsersPage() {
  const { t } = useTranslation();
  const { users, loading, filters, setFilters, page, setPage, totalPages, total, refetch } =
    useUsers();

  const actions = useUserActions({ onSuccess: refetch });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);

  function handleCreate() {
    setSelectedUser(null);
    setFormMode('create');
    setFormOpen(true);
  }

  function handleEdit(user: User) {
    setSelectedUser(user);
    setFormMode('edit');
    setFormOpen(true);
  }

  function handleToggleStatus(user: User) {
    setStatusUser(user);
    setStatusOpen(true);
  }

  async function handleFormSubmit(data: CreateUserFormData | UpdateUserFormData) {
    let success: boolean;
    if (formMode === 'create') {
      success = await actions.createUser(data as CreateUserFormData);
    } else {
      success = await actions.updateUser(selectedUser!.id, data as UpdateUserFormData);
    }
    if (success) {
      setFormOpen(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusUser) return;
    const success = await actions.toggleStatus(statusUser.id);
    if (success) {
      setStatusOpen(false);
    }
  }

  async function handleUnlock(user: User) {
    await actions.unlockUser(user.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.18em',
            color: 'var(--hy-teal-bright)',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Administração
        </p>
        <h1
          className="hy-display"
          style={{
            fontSize: 32,
            margin: 0,
            color: 'var(--hy-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          {t('users.title')}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13.5,
            color: 'var(--hy-ink-dim)',
            lineHeight: 1.5,
          }}
        >
          {t('users.description')}
        </p>
      </div>

      <UserFilters
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        role={filters.role}
        onRoleChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}
        isActive={filters.isActive}
        onStatusChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}
        onCreateClick={handleCreate}
      />

      <UserTable
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onUnlock={handleUnlock}
      />

      <UserPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        user={selectedUser}
        loading={actions.loading}
        onSubmit={handleFormSubmit}
      />

      <UserStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        user={statusUser}
        loading={actions.loading}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
