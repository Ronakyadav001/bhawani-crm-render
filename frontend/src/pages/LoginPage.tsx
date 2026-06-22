import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../store/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export function LoginPage() {
  const { user, login } = useAuth();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@bhawanifitness.com", password: "Admin@12345" }
  });

  if (user) return <Navigate to={user.home || "/"} replace />;

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-crm border border-line bg-soft shadow-glass md:grid-cols-[1fr_440px]">
        <section className="relative hidden min-h-[560px] overflow-hidden bg-deep p-8 text-soft md:block">
          <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 30% 18%, rgba(220,233,211,.35), transparent 32%), radial-gradient(circle at 80% 70%, rgba(216,183,101,.25), transparent 28%)" }} />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-crm bg-sage text-deep"><Leaf size={24} /></div>
              <div>
                <div className="text-lg font-black">Bhawani Fitness</div>
                <div className="text-sm text-sage2">Premium wellness CRM</div>
              </div>
            </div>
            <div>
              <div className="mb-4 inline-flex rounded-full border border-sage2/40 px-3 py-1 text-sm font-semibold text-sage">Yoga, diet, fertility and holistic care</div>
              <h1 className="max-w-md text-4xl font-black leading-tight">A calm command center for premium client care.</h1>
            </div>
          </div>
        </section>
        <section className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Secure CRM Login</div>
            <h2 className="mt-2 text-3xl font-black text-deep">Welcome back</h2>
          </div>
          <form
            onSubmit={handleSubmit(async (payload) => {
              try {
                await login(payload);
                toast.success("Login successful");
              } catch (error: any) {
                toast.error(error.response?.data?.message || "Login failed");
              }
            })}
            className="space-y-4"
          >
            <label className="space-y-1">
              <span className="label">Email</span>
              <div className="flex items-center gap-2 rounded-crm border border-line bg-cream px-3">
                <Mail size={17} className="text-moss" />
                <input className="h-11 w-full bg-transparent outline-none" type="email" {...register("email")} />
              </div>
            </label>
            <label className="space-y-1">
              <span className="label">Password</span>
              <div className="flex items-center gap-2 rounded-crm border border-line bg-cream px-3">
                <Lock size={17} className="text-moss" />
                <input className="h-11 w-full bg-transparent outline-none" type="password" {...register("password")} />
              </div>
            </label>
            <button className="h-11 w-full rounded-crm bg-deep text-sm font-black text-soft shadow-soft transition hover:bg-moss" disabled={formState.isSubmitting} type="submit">
              {formState.isSubmitting ? "Signing in" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
