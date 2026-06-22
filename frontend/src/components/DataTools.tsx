import { Download, Edit3, Eye, Plus, Search, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "./Badges";
import { dateTime, titleCase } from "../utils/format";

export function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-h-10 flex-1 items-center gap-2 rounded-crm border border-line bg-soft px-3 text-sm text-muted">
      <Search size={17} />
      <input className="w-full bg-transparent text-ink outline-none" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search" />
    </label>
  );
}

export function FilterBar({
  search,
  onSearch,
  status,
  onStatus,
  statusOptions = [],
  onAdd,
  onExport,
  canAdd = true
}: {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  statusOptions?: string[];
  onAdd?: () => void;
  onExport?: () => void;
  canAdd?: boolean;
}) {
  return (
    <div className="glass-panel flex flex-col gap-3 rounded-crm p-3 md:flex-row md:items-center">
      <SearchInput value={search} onChange={onSearch} />
      {statusOptions.length > 0 && (
        <select className="field md:w-[210px]" value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{titleCase(option)}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button className="icon-button" type="button" onClick={onExport} aria-label="Export CSV" title="Export CSV">
          <Download size={17} />
        </button>
        {canAdd && (
          <button className="inline-flex h-10 items-center gap-2 rounded-crm bg-deep px-4 text-sm font-bold text-soft shadow-soft transition hover:bg-moss" type="button" onClick={onAdd}>
            <Plus size={17} />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

const flatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return dateTime(value);
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.fullName || record.email) return String(record.fullName || record.email);
    if (record.user && typeof record.user === "object") {
      const user = record.user as Record<string, unknown>;
      return String(user.fullName || user.email || "-");
    }
    if (record.name || record.title) return String(record.name || record.title);
    return "View";
  }
  return String(value);
};

const visibleKeys = (row: Record<string, unknown>) =>
  Object.keys(row)
    .filter((key) => !["id", "passwordHash", "tokenHash", "metadata"].includes(key))
    .slice(0, 7);

export function DataTable({
  rows,
  loading,
  onEdit,
  onDelete,
  onView
}: {
  rows: Record<string, unknown>[];
  loading?: boolean;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onView?: (row: Record<string, unknown>) => void;
}) {
  const keys = rows[0] ? visibleKeys(rows[0]) : [];
  return (
    <div className="glass-panel overflow-hidden rounded-crm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-cream2/70 text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              {keys.map((key) => <th key={key} className="whitespace-nowrap px-4 py-3 font-black">{titleCase(key)}</th>)}
              <th className="px-4 py-3 text-right font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-soft/55">
            {loading && Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {(keys.length ? keys : ["one", "two", "three", "four"]).map((key) => (
                  <td key={key} className="px-4 py-4"><div className="h-4 w-28 animate-pulse rounded bg-cream2" /></td>
                ))}
                <td className="px-4 py-4"><div className="ml-auto h-8 w-24 animate-pulse rounded bg-cream2" /></td>
              </tr>
            ))}
            {!loading && rows.map((row) => (
              <tr key={String(row.id)} className="align-top transition hover:bg-sage/35">
                {keys.map((key) => {
                  const value = row[key];
                  const looksLikeStatus = key.toLowerCase().includes("status") || key === "role" || key === "priority";
                  return (
                    <td key={key} className="max-w-[260px] px-4 py-3 text-ink">
                      {looksLikeStatus ? <StatusBadge value={value} /> : <span className="line-clamp-2">{flatValue(value)}</span>}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {onView && <button className="icon-button" type="button" onClick={() => onView(row)} aria-label="View"><Eye size={16} /></button>}
                    {onEdit && <button className="icon-button" type="button" onClick={() => onEdit(row)} aria-label="Edit"><Edit3 size={16} /></button>}
                    {onDelete && <button className="icon-button text-clay" type="button" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted" colSpan={keys.length + 1}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, body, onCancel, onConfirm }: { open: boolean; title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-crm p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-deep">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="flex justify-end gap-2">
          <button className="rounded-crm border border-line bg-soft px-4 py-2 text-sm font-bold text-muted" type="button" onClick={onCancel}>Cancel</button>
          <button className="rounded-crm bg-clay px-4 py-2 text-sm font-bold text-soft" type="button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export function ModalFrame({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 w-full max-w-3xl rounded-crm border border-line bg-cream shadow-glass">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-soft/90 px-5 py-4 backdrop-blur">
          <h2 className="text-xl font-black text-deep">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormActions({ submitting, onCancel }: { submitting?: boolean; onCancel: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button className="rounded-crm border border-line bg-soft px-4 py-2 text-sm font-bold text-muted" type="button" onClick={onCancel}>Cancel</button>
      <button className="rounded-crm bg-deep px-5 py-2 text-sm font-bold text-soft shadow-soft" type="submit" disabled={submitting}>{submitting ? "Saving" : "Save"}</button>
    </div>
  );
}
