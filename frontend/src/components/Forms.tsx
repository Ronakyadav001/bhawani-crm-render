import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions, ModalFrame } from "./DataTools";

type FormProps = {
  open: boolean;
  initial?: Record<string, any> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
};

const roles = ["SUPER_ADMIN", "SALES_ADMIN", "YOGA_TRAINER", "DIETICIAN", "SUPPORT_ADMIN", "CLIENT"] as const;

const userSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(roles),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  password: z.string().optional()
});

const leadSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  source: z.enum(["WEBSITE", "WHATSAPP", "INSTAGRAM", "MANUAL", "REFERRAL", "APP"]).default("MANUAL"),
  healthGoal: z.string().optional(),
  leadStatus: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"]).default("NEW"),
  assignedSalesId: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional()
});

const clientSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.coerce.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("India"),
  maritalStatus: z.string().optional(),
  healthGoal: z.string().optional(),
  fertilityStatus: z.string().optional(),
  notes: z.string().optional(),
  assignedSalesId: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  assignedDieticianId: z.string().optional(),
  assignedSupportId: z.string().optional()
});

const subscriptionSchema = z.object({
  clientId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"]).default("ACTIVE"),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).default("PAID"),
  source: z.enum(["WEBSITE", "SUPER_ADMIN_MANUAL", "APP"]).default("SUPER_ADMIN_MANUAL")
});

const onboardingSchema = z.object({
  clientId: z.string().min(1),
  salesAdminId: z.string().optional(),
  scheduledAt: z.string().min(1),
  callType: z.string().min(2),
  callLink: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "MISSED", "RESCHEDULED", "CANCELLED"]).default("SCHEDULED"),
  notes: z.string().optional()
});

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-1">
      <span className="label">{label}</span>
      <input className="field" {...props} />
    </label>
  );
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="space-y-1">
      <span className="label">{label}</span>
      <select className="field" {...props}>{children}</select>
    </label>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="space-y-1 md:col-span-2">
      <span className="label">{label}</span>
      <textarea className="field min-h-24" {...props} />
    </label>
  );
}

export function UserFormModal({ open, initial, submitting, onClose, onSubmit }: FormProps) {
  const { register, handleSubmit, reset } = useForm<any>({
    resolver: zodResolver(userSchema),
    values: {
      fullName: initial?.fullName || "",
      email: initial?.email || "",
      phone: initial?.phone || "",
      role: initial?.role || "SALES_ADMIN",
      status: initial?.status || "ACTIVE",
      password: ""
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit User" : "Create User"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" {...register("fullName")} />
        <Input label="Email" type="email" {...register("email")} />
        <Input label="Phone" {...register("phone")} />
        <Select label="Role" {...register("role")}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</Select>
        <Select label="Status" {...register("status")}>{["ACTIVE", "INACTIVE", "SUSPENDED"].map((status) => <option key={status} value={status}>{status}</option>)}</Select>
        <Input label="Temporary password" type="text" {...register("password")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={() => { reset(); onClose(); }} /></div>
      </form>
    </ModalFrame>
  );
}

export function ClientFormModal({ open, initial, submitting, onClose, onSubmit }: FormProps) {
  const user = initial?.user || {};
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(clientSchema),
    values: {
      fullName: user.fullName || initial?.fullName || "",
      email: user.email || initial?.email || "",
      phone: user.phone || initial?.phone || "",
      gender: initial?.gender || "",
      age: initial?.age || undefined,
      city: initial?.city || "",
      state: initial?.state || "",
      country: initial?.country || "India",
      maritalStatus: initial?.maritalStatus || "",
      healthGoal: initial?.healthGoal || "",
      fertilityStatus: initial?.fertilityStatus || "",
      notes: initial?.notes || "",
      assignedSalesId: initial?.assignedSalesId || "",
      assignedTrainerId: initial?.assignedTrainerId || "",
      assignedDieticianId: initial?.assignedDieticianId || "",
      assignedSupportId: initial?.assignedSupportId || ""
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit Client" : "Add Premium Client"} onClose={onClose}>
      <form
        onSubmit={handleSubmit((data) => {
          const { fullName, email, phone, ...client } = data;
          onSubmit(initial ? client : { ...client, user: { fullName, email, phone } });
        })}
        className="grid gap-4 md:grid-cols-2"
      >
        <Input label="Full name" {...register("fullName")} />
        <Input label="Email" type="email" {...register("email")} />
        <Input label="Phone" {...register("phone")} />
        <Input label="Gender" {...register("gender")} />
        <Input label="Age" type="number" {...register("age")} />
        <Input label="City" {...register("city")} />
        <Input label="State" {...register("state")} />
        <Input label="Country" {...register("country")} />
        <Input label="Marital status" {...register("maritalStatus")} />
        <Input label="Fertility status" {...register("fertilityStatus")} />
        <Input label="Health goal" {...register("healthGoal")} />
        <Input label="Assigned sales ID" {...register("assignedSalesId")} />
        <Input label="Assigned trainer ID" {...register("assignedTrainerId")} />
        <Input label="Assigned dietician ID" {...register("assignedDieticianId")} />
        <Input label="Assigned support ID" {...register("assignedSupportId")} />
        <TextArea label="Notes" {...register("notes")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function LeadFormModal({ open, initial, submitting, onClose, onSubmit }: FormProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(leadSchema),
    values: {
      fullName: initial?.fullName || "",
      phone: initial?.phone || "",
      email: initial?.email || "",
      source: initial?.source || "MANUAL",
      healthGoal: initial?.healthGoal || "",
      leadStatus: initial?.leadStatus || "NEW",
      assignedSalesId: initial?.assignedSalesId || "",
      notes: initial?.notes || "",
      nextFollowUpAt: initial?.nextFollowUpAt ? String(initial.nextFollowUpAt).slice(0, 16) : ""
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit Lead" : "Add Lead"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" {...register("fullName")} />
        <Input label="Phone" {...register("phone")} />
        <Input label="Email" type="email" {...register("email")} />
        <Select label="Source" {...register("source")}>{["WEBSITE", "WHATSAPP", "INSTAGRAM", "MANUAL", "REFERRAL", "APP"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Input label="Health goal" {...register("healthGoal")} />
        <Select label="Status" {...register("leadStatus")}>{["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Input label="Assigned sales ID" {...register("assignedSalesId")} />
        <Input label="Next follow-up" type="datetime-local" {...register("nextFollowUpAt")} />
        <TextArea label="Notes" {...register("notes")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function SubscriptionModal({ open, initial, submitting, onClose, onSubmit }: FormProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(subscriptionSchema),
    values: {
      clientId: initial?.clientId || "",
      planId: initial?.planId || "",
      startDate: initial?.startDate ? String(initial.startDate).slice(0, 10) : "",
      endDate: initial?.endDate ? String(initial.endDate).slice(0, 10) : "",
      status: initial?.status || "ACTIVE",
      paymentStatus: initial?.paymentStatus || "PAID",
      source: initial?.source || "SUPER_ADMIN_MANUAL"
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit Subscription" : "Create Subscription"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Client ID" {...register("clientId")} />
        <Input label="Plan ID" {...register("planId")} />
        <Input label="Start date" type="date" {...register("startDate")} />
        <Input label="End date" type="date" {...register("endDate")} />
        <Select label="Status" {...register("status")}>{["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Select label="Payment status" {...register("paymentStatus")}>{["PENDING", "PAID", "FAILED", "REFUNDED"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Select label="Source" {...register("source")}>{["WEBSITE", "SUPER_ADMIN_MANUAL", "APP"].map((value) => <option key={value}>{value}</option>)}</Select>
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function OnboardingCallModal({ open, initial, submitting, onClose, onSubmit }: FormProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(onboardingSchema),
    values: {
      clientId: initial?.clientId || "",
      salesAdminId: initial?.salesAdminId || "",
      scheduledAt: initial?.scheduledAt ? String(initial.scheduledAt).slice(0, 16) : "",
      callType: initial?.callType || "Video consultation",
      callLink: initial?.callLink || "",
      status: initial?.status || "SCHEDULED",
      notes: initial?.notes || ""
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit Onboarding Call" : "Schedule Onboarding Call"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Client ID" {...register("clientId")} />
        <Input label="Sales admin ID" {...register("salesAdminId")} />
        <Input label="Scheduled at" type="datetime-local" {...register("scheduledAt")} />
        <Input label="Call type" {...register("callType")} />
        <Input label="Call link" {...register("callLink")} />
        <Select label="Status" {...register("status")}>{["SCHEDULED", "COMPLETED", "MISSED", "RESCHEDULED", "CANCELLED"].map((value) => <option key={value}>{value}</option>)}</Select>
        <TextArea label="Notes" {...register("notes")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function GenericJsonModal({ open, initial, submitting, onClose, onSubmit, title }: FormProps & { title: string }) {
  const { register, handleSubmit } = useForm<{ payload: string }>({
    values: { payload: JSON.stringify(initial || {}, null, 2) }
  });
  return (
    <ModalFrame open={open} title={title} onClose={onClose}>
      <form
        onSubmit={handleSubmit(({ payload }) => {
          onSubmit(JSON.parse(payload || "{}"));
        })}
      >
        <textarea className="field min-h-[340px] font-mono text-xs" {...register("payload")} />
        <FormActions submitting={submitting} onCancel={onClose} />
      </form>
    </ModalFrame>
  );
}
