import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PageRoute, Paginated } from "../types";
import { api, crmCreate, crmDelete, crmList, crmUpdate } from "../api/client";
import { ChatWindow, DietPlanBuilder, RecordingUploader, TicketThread, YogaSessionForm } from "../components/Builders";
import { ConfirmModal, DataTable, FilterBar, ModalFrame } from "../components/DataTools";
import { ClientFormModal, GenericJsonModal, LeadFormModal, OnboardingCallModal, SubscriptionModal, UserFormModal } from "../components/Forms";
import { useAuth } from "../store/auth";

const readonlyResources = new Set(["activity-logs"]);

const formFor = (resource?: string) => {
  switch (resource) {
    case "users": return UserFormModal;
    case "clients": return ClientFormModal;
    case "leads": return LeadFormModal;
    case "subscriptions": return SubscriptionModal;
    case "onboarding-calls": return OnboardingCallModal;
    case "diet-plans": return DietPlanBuilder;
    case "yoga-sessions": return YogaSessionForm;
    case "recordings": return RecordingUploader;
    case "support-tickets": return TicketThread;
    case "chat-messages": return ChatWindow;
    default: return GenericJsonModal;
  }
};

export function ResourcePage({ route }: { route: PageRoute }) {
  const resource = route.resource!;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearch((current) => (current === urlSearch ? current : urlSearch));
    setPage(1);
  }, [searchParams]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("search", value);
    else next.delete("search");
    setSearchParams(next, { replace: true });
  };

  const params = useMemo(() => ({ page, limit: 10, search, status }), [page, search, status]);
  const query = useQuery({
    queryKey: ["crm", resource, params],
    queryFn: () => crmList<Record<string, unknown>>(resource, params)
  });
  const data = query.data as Paginated<Record<string, unknown>> | undefined;

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editing?.id) return crmUpdate(resource, String(editing.id), payload);
      return crmCreate(resource, payload);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["crm", resource] });
      setModalOpen(false);
      setEditing(null);
      const temp = result?.generatedTemporaryPassword || result?.temporaryPassword;
      toast.success(temp ? `Saved. Temporary password: ${temp}` : "Saved");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Save failed")
  });

  const deleteMutation = useMutation({
    mutationFn: () => crmDelete(resource, String(deleting?.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", resource] });
      setDeleting(null);
      toast.success("Deleted");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Delete failed")
  });

  const FormComponent = formFor(resource) as any;
  const canAdd = !readonlyResources.has(resource);

  const exportCsv = async () => {
    const response = await api.get(`/crm/reports/${resource}.csv`, { params, responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${resource}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-crm p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{route.label}</div>
            <h2 className="mt-1 text-3xl font-black text-deep">{route.label}</h2>
          </div>
          <div className="text-sm font-semibold text-muted">{data?.meta.total || 0} records</div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearch={updateSearch}
        status={status}
        onStatus={(value) => { setStatus(value); setPage(1); }}
        statusOptions={route.statusOptions}
        onAdd={() => { setEditing(null); setModalOpen(true); }}
        onExport={exportCsv}
        canAdd={canAdd}
      />

      <DataTable
        rows={data?.items || []}
        loading={query.isLoading}
        onEdit={canAdd ? (row) => { setEditing(row); setModalOpen(true); } : undefined}
        onDelete={user?.role === "SUPER_ADMIN" && canAdd ? setDeleting : undefined}
        onView={(row) => {
          if (resource === "clients" && user?.role === "SUPER_ADMIN") navigate(`/super-admin/clients/${row.id}`);
          else setPreview(row);
        }}
      />

      <div className="flex items-center justify-between rounded-crm border border-line bg-soft px-3 py-2 text-sm font-semibold text-muted">
        <span>Page {data?.meta.page || page} of {data?.meta.pages || 1}</span>
        <div className="flex gap-2">
          <button className="icon-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <button className="icon-button" type="button" disabled={Boolean(data && page >= data.meta.pages)} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>

      <FormComponent
        open={modalOpen}
        initial={editing}
        submitting={saveMutation.isPending}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={(payload: Record<string, unknown>) => saveMutation.mutate(payload)}
        title={editing ? `Edit ${route.label}` : `Create ${route.label}`}
      />

      <ModalFrame open={Boolean(preview)} title="Record Detail" onClose={() => setPreview(null)}>
        <pre className="max-h-[70vh] overflow-auto rounded-crm bg-deep p-4 text-xs text-soft">{JSON.stringify(preview, null, 2)}</pre>
      </ModalFrame>

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete record"
        body="This action permanently removes the selected record."
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
