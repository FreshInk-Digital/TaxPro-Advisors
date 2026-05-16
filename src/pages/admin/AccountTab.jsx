// File: src/pages/admin/AccountTab.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Lock, AlertTriangle, LogOut, Trash2,
  CheckCircle2, Loader2, Eye, EyeOff, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { ResponseDialog } from "@/components/ui/response-dialog";
import { PhoneInputField } from "@/components/ui/phone-input";
import { Controller } from "react-hook-form";
import { usersApi, authApi, clearToken } from "@/lib/api";
import { userSchema, changePasswordSchema } from "@/lib/schemas";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem("adminUser") || "null"); }
  catch { return null; }
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, iconClass, title, subtitle, children }) => (
  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 border-b border-border px-6 py-5">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-bold text-foreground text-base">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

// ─── Password field with show/hide ────────────────────────────────────────────
const PasswordInput = React.forwardRef(({ label, error, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Input 
          ref={ref}
          type={show ? "text" : "password"} 
          className={cn("pr-10 rounded-xl", error && "border-destructive")} 
          {...props} 
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error.message}</p>}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

// ─── Main Component ───────────────────────────────────────────────────────────
export const AccountTab = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const storedUser = getStoredUser();

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // ── Personal Details Form ─────────────────────────────────────────────────
  const { register: regP, handleSubmit: handleP, control: ctrlP, formState: { errors: errP, isSubmitting: subP } } = useForm({
    resolver: zodResolver(userSchema.omit({ role: true })),
    defaultValues: {
      firstName: storedUser?.firstName || "",
      lastName: storedUser?.lastName || "",
      email: storedUser?.email || "",
      phoneNumber: storedUser?.phoneNumber || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => usersApi.update(storedUser?.id, { ...payload, role: storedUser?.role || "admin" }),
    onSuccess: (res) => {
      const updated = res?.data;
      if (updated) sessionStorage.setItem("adminUser", JSON.stringify(updated));
      toast.success("Profile updated!");
      qc.invalidateQueries(["admin-users"]);
    },
    onError: (e) => toast.error(e?.message || "Failed to update profile"),
  });

  // ── Change Password Form ──────────────────────────────────────────────────
  const { register: regC, handleSubmit: handleC, reset: resetC, formState: { errors: errC, isSubmitting: subC } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }) => usersApi.changePassword(storedUser?.id, oldPassword, newPassword),
    onSuccess: () => { toast.success("Password changed!"); resetC(); },
    onError: (e) => toast.error(e?.message || "Failed to change password"),
  });

  // ── Logout / Delete Account ───────────────────────────────────────────────
  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* silent */ }
    clearToken();
    toast.success("Logged out successfully.");
    navigate("/admin/login");
  };

  const deleteSelfMutation = useMutation({
    mutationFn: () => usersApi.delete(storedUser?.id),
    onSuccess: () => {
      clearToken();
      toast.success("Account deleted.");
      navigate("/admin/login");
    },
    onError: (e) => toast.error(e?.message || "Failed to delete account"),
  });

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title="My Account"
          breadcrumbs={[{ label: "Account" }]}
        />

        {/* ── 1. Personal Details ────────────────────────────────────── */}
        <SectionCard
          icon={User}
          iconClass="bg-primary/10 text-primary"
          title="Personal Details"
          subtitle="Update your name, email, and phone number"
        >
          <form onSubmit={handleP((v) => updateMutation.mutate(v))} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("firstName")}</label>
                <Input placeholder="John" {...regP("firstName")} className={cn("rounded-xl", errP.firstName && "border-destructive")} />
                {errP.firstName && <p className="mt-1 text-xs text-destructive">{errP.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("lastName")}</label>
                <Input placeholder="Doe" {...regP("lastName")} className={cn("rounded-xl", errP.lastName && "border-destructive")} />
                {errP.lastName && <p className="mt-1 text-xs text-destructive">{errP.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("emailAddress")}</label>
              <Input type="email" placeholder="john@example.com" {...regP("email")} className={cn("rounded-xl", errP.email && "border-destructive")} />
              {errP.email && <p className="mt-1 text-xs text-destructive">{errP.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("phone")}</label>
              <Controller
                name="phoneNumber"
                control={ctrlP}
                render={({ field }) => <PhoneInputField value={field.value} onChange={field.onChange} error={errP.phoneNumber} />}
              />
              {errP.phoneNumber && <p className="mt-1 text-xs text-destructive">{errP.phoneNumber.message}</p>}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="min-w-[140px] rounded-xl" disabled={updateMutation.isPending || subP}>
                {(updateMutation.isPending || subP) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Update Profile
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ── 2. Change Password ─────────────────────────────────────── */}
        <SectionCard
          icon={Lock}
          iconClass="bg-amber-500/10 text-amber-500"
          title="Change Password"
          subtitle="Keep your account secure with a strong password"
        >
          <form onSubmit={handleC((v) => changePasswordMutation.mutate(v))} className="space-y-4" noValidate>
            <PasswordInput label="Current Password" error={errC.oldPassword} {...regC("oldPassword")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput label="New Password" error={errC.newPassword} {...regC("newPassword")} />
              <PasswordInput label="Confirm New Password" error={errC.confirmPassword} {...regC("confirmPassword")} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline" className="min-w-[160px] rounded-xl border-amber-500/40 text-amber-600 hover:bg-amber-500/10" disabled={changePasswordMutation.isPending || subC}>
                {(changePasswordMutation.isPending || subC) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Update Password
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ── 3. Danger Zone ────────────────────────────────────────── */}
        <SectionCard
          icon={ShieldAlert}
          iconClass="bg-destructive/10 text-destructive"
          title="Danger Zone"
          subtitle="These actions are irreversible. Proceed with caution."
        >
          <div className="space-y-3">
            {/* Logout */}
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <div>
                <p className="font-semibold text-sm text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out of the admin panel on this device</p>
              </div>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl min-w-[110px]"
                onClick={() => setLogoutDialog(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
              <div>
                <p className="font-semibold text-sm text-destructive">Delete My Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your admin account. This cannot be undone.</p>
              </div>
              <Button
                variant="destructive"
                className="rounded-xl min-w-[130px]"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Logout Confirmation Dialog */}
      <ResponseDialog
        open={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        variant="warning"
        title="Sign Out?"
        subtitle="You will be logged out of the admin panel and redirected to the login page."
        actions={
          <>
            <Button variant="outline" className="min-w-[100px] rounded-xl" onClick={() => setLogoutDialog(false)}>Stay</Button>
            <Button variant="destructive" className="min-w-[120px] rounded-xl" onClick={() => { setLogoutDialog(false); handleLogout(); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </>
        }
      />

      {/* Delete Account Confirmation Dialog */}
      <ResponseDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        variant="error"
        title="Delete Your Account?"
        subtitle="This will permanently delete your admin account and log you out. There is no going back."
        actions={
          <>
            <Button variant="outline" className="min-w-[100px] rounded-xl" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="min-w-[140px] rounded-xl"
              disabled={deleteSelfMutation.isPending}
              onClick={() => { setDeleteDialog(false); deleteSelfMutation.mutate(); }}
            >
              {deleteSelfMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Yes, Delete
            </Button>
          </>
        }
      />
    </>
  );
};
