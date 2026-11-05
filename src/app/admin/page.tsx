"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/layout/ProtectedPage";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminOverviewView } from "@/components/admin/AdminOverviewView";
import { AdminAiRouterView } from "@/components/admin/AdminAiRouterView";
import { AdminSettingsView } from "@/components/admin/AdminSettingsView";
import { AdminAssetsView } from "@/components/admin/AdminAssetsView";
import { AdminProjectsView } from "@/components/admin/AdminProjectsView";
import { AdminLedgerView } from "@/components/admin/AdminLedgerView";
import { AdminSidebar, type AdminSection } from "@/components/admin/AdminSidebar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { APP_CONFIG } from "@/config/app";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { id } from "@/lib/i18n/id";
import { formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import type { AdminOverviewStats, AdminUser, PlanId, Role, SystemSettingsPayload } from "@/types";

const planOrder: PlanId[] = ["trial", "starter", "pro"];

const planOptions = planOrder.map((plan) => ({
  value: plan,
  label: APP_CONFIG.plans[plan].label
}));

const roleOptions = [
  { value: "user", label: id.admin.roleUser },
  { value: "admin", label: id.admin.roleAdmin }
];

interface CreateForm {
  email: string;
  name: string;
  password: string;
  plan: PlanId;
  credits: number;
  projectQuota: number;
  role: Role;
}

interface EditForm {
  name: string;
  plan: PlanId;
  credits: number;
  projectQuota: number;
  role: Role;
  disabled: boolean;
}

function defaultCreateForm(): CreateForm {
  return {
    email: "",
    name: "",
    password: "",
    plan: "trial",
    credits: 2,
    projectQuota: 1,
    role: "user"
  };
}

function AdminContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);

  // Active section & mobile drawer
  const [section, setSection] = useState<AdminSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // System Settings & AI Router
  const [settingsData, setSettingsData] = useState<SystemSettingsPayload | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Users data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");

  // Create User Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit User Modal
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    plan: "trial",
    credits: 0,
    projectQuota: 1,
    role: "user",
    disabled: false
  });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Credits Modal
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditReason, setCreditReason] = useState("");
  const [creditError, setCreditError] = useState("");
  const [addingCredits, setAddingCredits] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await api.adminGetOverview();
      setOverviewStats(data);
    } catch {
      // Ignore initial overview error if unmounted
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api.adminListUsers();
      setUsers(data);
      setUsersError("");
    } catch (loadError) {
      setUsersError(messageFromError(loadError));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await api.adminGetSettings();
      setSettingsData(data);
    } catch {
      // Ignore if unmounted
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadOverview(), loadUsers(), loadSettings()]);
      showToast("Data admin berhasil disegarkan", "success");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      void loadOverview();
      void loadUsers();
      void loadSettings();
    }
  }, [user?.role, loadOverview, loadUsers, loadSettings]);

  function openCreate() {
    setCreateForm(defaultCreateForm());
    setCreateError("");
    setCreateOpen(true);
  }

  function openEdit(target: AdminUser) {
    setEditTarget(target);
    setEditForm({
      name: target.name,
      plan: target.plan,
      credits: target.credits,
      projectQuota: target.projectQuota,
      role: target.role,
      disabled: Boolean(target.disabled)
    });
    setEditError("");
  }

  function openCredits(target: AdminUser) {
    setCreditTarget(target);
    setCreditAmount(10);
    setCreditReason("");
    setCreditError("");
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError("");
    try {
      const created = await api.adminCreateUser(createForm);
      setUsers((current) => [created, ...current]);
      setCreateOpen(false);
      showToast(id.admin.userCreated, "success");
      void loadOverview();
    } catch (createFailure) {
      setCreateError(messageFromError(createFailure));
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await api.adminUpdateUser(editTarget.id, editForm);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditTarget(null);
      showToast(id.admin.userUpdated, "success");
    } catch (saveFailure) {
      setEditError(messageFromError(saveFailure));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAddCredits() {
    if (!creditTarget) return;
    setAddingCredits(true);
    setCreditError("");
    try {
      const updated = await api.adminAddCredits(creditTarget.id, creditAmount, creditReason);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setCreditTarget(null);
      showToast(id.admin.creditsAdded, "success");
    } catch (creditFailure) {
      setCreditError(messageFromError(creditFailure));
    } finally {
      setAddingCredits(false);
    }
  }

  async function handleToggleDisabled(target: AdminUser) {
    setTogglingId(target.id);
    try {
      const updated = await api.adminUpdateUser(target.id, { disabled: !target.disabled });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast(id.admin.userUpdated, "success");
    } catch (toggleFailure) {
      showToast(messageFromError(toggleFailure), "error");
    } finally {
      setTogglingId(null);
    }
  }

  if (!user) {
    return <LoadingScreen />;
  }

  if (user.role !== "admin") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <Card variant="raised" padding="lg" className="w-full max-w-md text-center shadow-neu-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <Icon name="shield" size={26} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-ink">{id.admin.guard}</h1>
          <p className="mt-2 text-xs text-muted">
            Anda harus masuk dengan akun bertaraf administrator untuk mengakses panel ini.
          </p>
          <Button variant="primary" className="mt-5" onClick={() => router.push("/app/workspace/")}>
            {id.admin.backToWorkspace}
          </Button>
        </Card>
      </main>
    );
  }

  const filteredUsers = users.filter((item) => {
    const query = search.trim().toLowerCase();
    return !query || item.name.toLowerCase().includes(query) || item.email.toLowerCase().includes(query);
  });

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Collapsible Responsive Sidebar */}
      <AdminSidebar
        currentSection={section}
        onSelectSection={setSection}
        counts={{
          users: users.length,
          projects: overviewStats?.projectsCount,
          assets: overviewStats?.audioFilesCount
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <AdminHeader
          currentSection={section}
          user={user}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Main Content Body */}
        <main className="page-pad mx-auto w-full max-w-[1360px] flex-1 py-6">
          {section === "overview" && (
            <AdminOverviewView
              stats={overviewStats}
              loading={overviewLoading}
              onNavigate={setSection}
              onRefresh={handleRefresh}
            />
          )}

          {section === "ai-router" && (
            <AdminAiRouterView
              settings={settingsData}
              loading={settingsLoading}
              onSaved={setSettingsData}
            />
          )}

          {section === "assets" && (
            <AdminAssetsView onRefreshStats={loadOverview} />
          )}

          {section === "users" && (
            <section className="space-y-4">
              <Card variant="raised" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-neu-sm">
                <div className="relative w-full sm:max-w-sm">
                  <Icon
                    name="search"
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={id.admin.searchUsers}
                    aria-label={id.admin.searchUsers}
                    className="neu-field pl-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadUsers()}
                    leftIcon={<Icon name="refresh" size={14} className={usersLoading ? "animate-spin" : ""} />}
                    className="h-9 px-3"
                  >
                    Segarkan
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreate}
                    leftIcon={<Icon name="plus" size={15} />}
                    className="h-9 px-3.5"
                  >
                    {id.admin.createUser}
                  </Button>
                </div>
              </Card>

              {usersError ? (
                <Card variant="inset" padding="md" className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-danger">{usersError}</p>
                  <Button variant="secondary" size="sm" onClick={() => void loadUsers()} leftIcon={<Icon name="refresh" size={14} />}>
                    {id.common.retry}
                  </Button>
                </Card>
              ) : null}

              {usersLoading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-44 rounded-xl" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <EmptyState
                  icon="users"
                  title={search.trim() ? id.admin.noUserResults : id.admin.noUsers}
                  action={<Button variant="secondary" onClick={openCreate}>{id.admin.createUser}</Button>}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredUsers.map((item) => (
                    <Card key={item.id} variant="raised" padding="md" className="space-y-3 shadow-neu-sm">
                      <div className="flex items-start gap-3">
                        <Avatar name={item.name || item.email} src={item.avatar} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-ink">{item.name || item.email}</p>
                          <p className="truncate text-xs text-muted">{item.email}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-extrabold text-primary-strong">
                              {APP_CONFIG.plans[item.plan].label}
                            </span>
                            <span className="rounded-md bg-bg-sunken px-2 py-0.5 text-[10px] font-extrabold text-muted">
                              {item.role === "admin" ? id.admin.roleAdmin : id.admin.roleUser}
                            </span>
                            {item.disabled ? (
                              <span className="rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-extrabold text-danger">
                                {id.admin.disabled}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-bg-sunken p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{id.admin.credits}</p>
                          <p className="text-sm font-extrabold text-ink">{item.credits}</p>
                        </div>
                        <div className="rounded-lg bg-bg-sunken p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{id.admin.projects}</p>
                          <p className="text-sm font-extrabold text-ink">{item.projectCount}</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted">{formatRelativeTime(item.createdAt)}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line/60">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(item)} leftIcon={<Icon name="edit" size={13} />} className="h-8 px-2.5 text-xs">
                          {id.common.edit}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openCredits(item)} leftIcon={<Icon name="coins" size={13} />} className="h-8 px-2.5 text-xs">
                          {id.admin.addCredits}
                        </Button>
                        <Button
                          variant={item.disabled ? "primary" : "ghost"}
                          size="sm"
                          onClick={() => void handleToggleDisabled(item)}
                          loading={togglingId === item.id}
                          disabled={item.id === user.id}
                          className="h-8 px-2.5 text-xs"
                        >
                          {item.disabled ? id.admin.enable : id.admin.disable}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {section === "projects" && (
            <AdminProjectsView onRefreshStats={loadOverview} />
          )}

          {section === "ledger" && (
            <AdminLedgerView />
          )}

          {section === "settings" && (
            <AdminSettingsView
              settings={settingsData}
              loading={settingsLoading}
              onSaved={setSettingsData}
            />
          )}
        </main>
      </div>

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={id.admin.createTitle}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              {id.common.cancel}
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} loading={creating}>
              {id.admin.submitCreate}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label={id.admin.email}
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
            required
          />
          <Input
            label={id.admin.name}
            value={createForm.name}
            onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
          />
          <Input
            label={id.admin.password}
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
            helper={id.admin.passwordHint}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={id.admin.plan}
              value={createForm.plan}
              onChange={(event) => setCreateForm({ ...createForm, plan: event.target.value as PlanId })}
              options={planOptions}
            />
            <Select
              label={id.admin.role}
              value={createForm.role}
              onChange={(event) => setCreateForm({ ...createForm, role: event.target.value as Role })}
              options={roleOptions}
            />
            <Input
              label={id.admin.credits}
              type="number"
              min={0}
              value={createForm.credits}
              onChange={(event) => setCreateForm({ ...createForm, credits: Number(event.target.value) })}
            />
            <Input
              label={id.admin.quota}
              type="number"
              min={1}
              value={createForm.projectQuota}
              onChange={(event) => setCreateForm({ ...createForm, projectQuota: Number(event.target.value) })}
            />
          </div>
          {createError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-2 text-xs font-semibold text-danger">
              {createError}
            </p>
          ) : null}
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={id.admin.editUser}
        description={editTarget?.email}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={savingEdit}>
              {id.common.cancel}
            </Button>
            <Button variant="primary" onClick={() => void handleSaveEdit()} loading={savingEdit}>
              {id.admin.saveUser}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label={id.admin.name}
            value={editForm.name}
            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={id.admin.plan}
              value={editForm.plan}
              onChange={(event) => setEditForm({ ...editForm, plan: event.target.value as PlanId })}
              options={planOptions}
            />
            <Select
              label={id.admin.role}
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value as Role })}
              options={roleOptions}
              disabled={editTarget?.id === user.id}
            />
            <Input
              label={id.admin.credits}
              type="number"
              min={0}
              value={editForm.credits}
              onChange={(event) => setEditForm({ ...editForm, credits: Number(event.target.value) })}
            />
            <Input
              label={id.admin.quota}
              type="number"
              min={1}
              value={editForm.projectQuota}
              onChange={(event) => setEditForm({ ...editForm, projectQuota: Number(event.target.value) })}
            />
          </div>
          <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted">
            <input
              type="checkbox"
              checked={editForm.disabled}
              onChange={(event) => setEditForm({ ...editForm, disabled: event.target.checked })}
              disabled={editTarget?.id === user.id}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            {id.admin.disabled}
          </label>
          {editTarget?.id === user.id ? (
            <p className="rounded-md bg-bg-sunken p-2 text-xs font-semibold text-muted">{id.admin.selfEditNote}</p>
          ) : null}
          {editError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-2 text-xs font-semibold text-danger">
              {editError}
            </p>
          ) : null}
        </div>
      </Modal>

      {/* Add Credits Modal */}
      <Modal
        open={Boolean(creditTarget)}
        onClose={() => setCreditTarget(null)}
        title={id.admin.addCredits}
        description={creditTarget?.email}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCreditTarget(null)} disabled={addingCredits}>
              {id.common.cancel}
            </Button>
            <Button variant="primary" onClick={() => void handleAddCredits()} loading={addingCredits}>
              {id.admin.addCredits}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label={id.admin.creditAmount}
            type="number"
            min={1}
            value={creditAmount}
            onChange={(event) => setCreditAmount(Number(event.target.value))}
          />
          <Input
            label={id.admin.creditReason}
            value={creditReason}
            onChange={(event) => setCreditReason(event.target.value)}
            placeholder={id.admin.creditReason}
          />
          {creditError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-2 text-xs font-semibold text-danger">
              {creditError}
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedPage>
      <AdminContent />
    </ProtectedPage>
  );
}
