import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable, FormActions, ModalFrame } from "./DataTools";

type BuilderProps = {
  open: boolean;
  initial?: Record<string, any> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
};

const mealSchema = z.object({
  mealType: z.enum(["MORNING", "BREAKFAST", "MID_MORNING", "LUNCH", "EVENING", "DINNER", "BEDTIME"]).default("BREAKFAST"),
  mealTime: z.string().optional(),
  foodItems: z.string().min(2),
  calories: z.coerce.number().optional(),
  protein: z.coerce.number().optional(),
  carbs: z.coerce.number().optional(),
  fats: z.coerce.number().optional(),
  instructions: z.string().optional()
});

const dietSchema = z.object({
  clientId: z.string().min(1),
  dieticianId: z.string().optional(),
  title: z.string().min(2),
  goal: z.string().optional(),
  planStartDate: z.string().min(1),
  planEndDate: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  notes: z.string().optional(),
  meals: z.array(mealSchema).min(1)
});

const yogaSchema = z.object({
  trainerId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  sessionType: z.string().min(2),
  category: z.string().optional(),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
  liveLink: z.string().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  assignAllActive: z.boolean().default(false),
  assignedClientIdsText: z.string().optional()
});

const recordingSchema = z.object({
  sessionId: z.string().min(1),
  trainerId: z.string().optional(),
  title: z.string().min(2),
  recordingUrl: z.string().min(4),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  isPremiumOnly: z.boolean().default(true)
});

const ticketSchema = z.object({
  clientId: z.string().min(1),
  assignedSupportId: z.string().optional(),
  subject: z.string().min(2),
  description: z.string().min(3),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
  source: z.enum(["APP_CHAT", "MANUAL", "WHATSAPP", "AI_ESCALATION"]).default("MANUAL")
});

const chatSchema = z.object({
  clientId: z.string().min(1),
  senderId: z.string().optional(),
  senderRole: z.enum(["SUPER_ADMIN", "SALES_ADMIN", "YOGA_TRAINER", "DIETICIAN", "SUPPORT_ADMIN", "CLIENT"]).default("SUPPORT_ADMIN"),
  message: z.string().min(1),
  relatedTicketId: z.string().optional()
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

export function MealScheduleBuilder({ control, register }: { control: any; register: any }) {
  const { fields, append, remove } = useFieldArray({ control, name: "meals" });
  return (
    <div className="md:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black text-deep">Meal Schedule</h3>
        <button className="inline-flex items-center gap-2 rounded-crm bg-moss px-3 py-2 text-sm font-bold text-soft" type="button" onClick={() => append({ mealType: "BREAKFAST", mealTime: "08:00", foodItems: "", instructions: "" })}>
          <Plus size={16} />
          Meal
        </button>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-crm border border-line bg-soft p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-bold text-deep">Meal {index + 1}</div>
              <button className="icon-button text-clay" type="button" onClick={() => remove(index)} aria-label="Remove meal"><Trash2 size={16} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Select label="Type" {...register(`meals.${index}.mealType`)}>
                {["MORNING", "BREAKFAST", "MID_MORNING", "LUNCH", "EVENING", "DINNER", "BEDTIME"].map((value) => <option key={value}>{value}</option>)}
              </Select>
              <Input label="Time" type="time" {...register(`meals.${index}.mealTime`)} />
              <Input label="Calories" type="number" {...register(`meals.${index}.calories`)} />
              <Input label="Protein" type="number" {...register(`meals.${index}.protein`)} />
              <Input label="Carbs" type="number" {...register(`meals.${index}.carbs`)} />
              <Input label="Fats" type="number" {...register(`meals.${index}.fats`)} />
              <label className="space-y-1 md:col-span-2">
                <span className="label">Food items</span>
                <input className="field" {...register(`meals.${index}.foodItems`)} />
              </label>
              <label className="space-y-1 md:col-span-4">
                <span className="label">Instructions</span>
                <textarea className="field min-h-20" {...register(`meals.${index}.instructions`)} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DietPlanBuilder({ open, initial, submitting, onClose, onSubmit }: BuilderProps) {
  const { register, handleSubmit, control } = useForm<any>({
    resolver: zodResolver(dietSchema),
    values: {
      clientId: initial?.clientId || "",
      dieticianId: initial?.dieticianId || "",
      title: initial?.title || "",
      goal: initial?.goal || "",
      planStartDate: initial?.planStartDate ? String(initial.planStartDate).slice(0, 10) : "",
      planEndDate: initial?.planEndDate ? String(initial.planEndDate).slice(0, 10) : "",
      status: initial?.status || "PUBLISHED",
      notes: initial?.notes || "",
      meals: initial?.meals?.length ? initial.meals : [{ mealType: "BREAKFAST", mealTime: "08:00", foodItems: "", calories: 300, protein: 12, carbs: 35, fats: 8, instructions: "" }]
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Revise Diet Plan" : "Create Diet Plan"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Client ID" {...register("clientId")} />
        <Input label="Dietician ID" {...register("dieticianId")} />
        <Input label="Title" {...register("title")} />
        <Input label="Goal" {...register("goal")} />
        <Input label="Start date" type="date" {...register("planStartDate")} />
        <Input label="End date" type="date" {...register("planEndDate")} />
        <Select label="Status" {...register("status")}>{["DRAFT", "PUBLISHED", "ARCHIVED"].map((value) => <option key={value}>{value}</option>)}</Select>
        <TextArea label="Notes" {...register("notes")} />
        <MealScheduleBuilder control={control} register={register} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function YogaSessionForm({ open, initial, submitting, onClose, onSubmit }: BuilderProps) {
  const { register, handleSubmit, watch } = useForm<any>({
    resolver: zodResolver(yogaSchema),
    values: {
      trainerId: initial?.trainerId || "",
      title: initial?.title || "",
      description: initial?.description || "",
      sessionType: initial?.sessionType || "Live class",
      category: initial?.category || "",
      scheduledStart: initial?.scheduledStart ? String(initial.scheduledStart).slice(0, 16) : "",
      scheduledEnd: initial?.scheduledEnd ? String(initial.scheduledEnd).slice(0, 16) : "",
      liveLink: initial?.liveLink || "",
      status: initial?.status || "SCHEDULED",
      assignAllActive: false,
      assignedClientIdsText: ""
    }
  });
  const assignAll = watch("assignAllActive");
  return (
    <ModalFrame open={open} title={initial ? "Edit Yoga Session" : "Create Live Session"} onClose={onClose}>
      <form
        onSubmit={handleSubmit((data) => {
          const { assignedClientIdsText, ...session } = data;
          onSubmit({ ...session, assignedClientIds: assignedClientIdsText?.split(",").map((item: string) => item.trim()).filter(Boolean) });
        })}
        className="grid gap-4 md:grid-cols-2"
      >
        <Input label="Trainer ID" {...register("trainerId")} />
        <Input label="Title" {...register("title")} />
        <Input label="Session type" {...register("sessionType")} />
        <Input label="Category" {...register("category")} />
        <Input label="Start" type="datetime-local" {...register("scheduledStart")} />
        <Input label="End" type="datetime-local" {...register("scheduledEnd")} />
        <Input label="Live link" {...register("liveLink")} />
        <Select label="Status" {...register("status")}>{["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"].map((value) => <option key={value}>{value}</option>)}</Select>
        <label className="flex items-center gap-2 rounded-crm border border-line bg-soft px-3 py-2 text-sm font-semibold text-deep">
          <input type="checkbox" {...register("assignAllActive")} />
          Assign all active premium users
        </label>
        {!assignAll && <Input label="Assigned client IDs" placeholder="comma separated" {...register("assignedClientIdsText")} />}
        <TextArea label="Description" {...register("description")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function RecordingUploader({ open, initial, submitting, onClose, onSubmit }: BuilderProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(recordingSchema),
    values: {
      sessionId: initial?.sessionId || "",
      trainerId: initial?.trainerId || "",
      title: initial?.title || "",
      recordingUrl: initial?.recordingUrl || "",
      thumbnailUrl: initial?.thumbnailUrl || "",
      category: initial?.category || "",
      isPremiumOnly: initial?.isPremiumOnly ?? true
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Edit Recording" : "Add Recording"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Session ID" {...register("sessionId")} />
        <Input label="Trainer ID" {...register("trainerId")} />
        <Input label="Title" {...register("title")} />
        <Input label="Recording URL" {...register("recordingUrl")} />
        <Input label="Thumbnail URL" {...register("thumbnailUrl")} />
        <Input label="Category" {...register("category")} />
        <label className="flex items-center gap-2 rounded-crm border border-line bg-soft px-3 py-2 text-sm font-semibold text-deep">
          <input type="checkbox" {...register("isPremiumOnly")} />
          Premium only
        </label>
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function AttendanceTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <DataTable rows={rows} />;
}

export function TicketThread({ open, initial, submitting, onClose, onSubmit }: BuilderProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(ticketSchema),
    values: {
      clientId: initial?.clientId || "",
      assignedSupportId: initial?.assignedSupportId || "",
      subject: initial?.subject || "",
      description: initial?.description || "",
      priority: initial?.priority || "MEDIUM",
      status: initial?.status || "OPEN",
      source: initial?.source || "MANUAL"
    }
  });
  return (
    <ModalFrame open={open} title={initial ? "Update Ticket" : "Create Ticket"} onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Client ID" {...register("clientId")} />
        <Input label="Assigned support ID" {...register("assignedSupportId")} />
        <Input label="Subject" {...register("subject")} />
        <Select label="Priority" {...register("priority")}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Select label="Status" {...register("status")}>{["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</Select>
        <Select label="Source" {...register("source")}>{["APP_CHAT", "MANUAL", "WHATSAPP", "AI_ESCALATION"].map((value) => <option key={value}>{value}</option>)}</Select>
        <TextArea label="Description" {...register("description")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}

export function ChatWindow({ open, initial, submitting, onClose, onSubmit }: BuilderProps) {
  const { register, handleSubmit } = useForm<any>({
    resolver: zodResolver(chatSchema),
    values: {
      clientId: initial?.clientId || "",
      senderId: initial?.senderId || "",
      senderRole: initial?.senderRole || "SUPPORT_ADMIN",
      message: initial?.message || "",
      relatedTicketId: initial?.relatedTicketId || ""
    }
  });
  return (
    <ModalFrame open={open} title="Send Chat Message" onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="grid gap-4 md:grid-cols-2">
        <Input label="Client ID" {...register("clientId")} />
        <Input label="Related ticket ID" {...register("relatedTicketId")} />
        <Input label="Sender ID" {...register("senderId")} />
        <Select label="Sender role" {...register("senderRole")}>{["SUPPORT_ADMIN", "DIETICIAN", "SUPER_ADMIN"].map((value) => <option key={value}>{value}</option>)}</Select>
        <TextArea label="Message" {...register("message")} />
        <div className="md:col-span-2"><FormActions submitting={submitting} onCancel={onClose} /></div>
      </form>
    </ModalFrame>
  );
}
