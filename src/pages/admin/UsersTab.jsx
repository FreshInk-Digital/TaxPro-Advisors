// File: src/pages/admin/UsersTab.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api";
import { userSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const makeDefault = () => ({
  firstName: "", lastName: "", email: "", phoneNumber: "", role: "USER",
});

export const UsersTab = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await usersApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const users = data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: makeDefault(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => usersApi.create({ ...payload, password: "Temp@1234!" }),
    onSuccess: () => { toast.success("User created! Default password: Temp@1234!"); qc.invalidateQueries(["admin-users"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: () => { toast.success("User updated!"); qc.invalidateQueries(["admin-users"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => { toast.success("User deleted."); qc.invalidateQueries(["admin-users"]); },
    onError: (e) => toast.error(e?.message || "Failed to delete user"),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset(makeDefault()); };

  const onEdit = (user) => {
    setEditing(user);
    reset({ firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "", phoneNumber: user.phoneNumber || "", role: user.role || "USER" });
    setShowForm(true);
  };

  const onSubmit = (values) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: values });
    else createMutation.mutate(values);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("usersManagement")}</h2>
        <Button size="sm" onClick={() => { closeForm(); setShowForm(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("addNew")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-5 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{editing ? t("edit") : t("addNew")} User</h3>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "u-fname", label: t("firstName"), field: "firstName", placeholder: "John" },
              { id: "u-lname", label: t("lastName"), field: "lastName", placeholder: "Doe" },
            ].map(({ id, label, field, placeholder }) => (
              <div key={field}>
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
                <Input id={id} placeholder={placeholder} {...register(field)} className={errors[field] ? "border-destructive" : ""} />
                {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field].message}</p>}
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="u-email" className="mb-1.5 block text-sm font-medium text-foreground">{t("emailAddress")}</label>
            <Input id="u-email" type="email" placeholder="john@example.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="u-phone" className="mb-1.5 block text-sm font-medium text-foreground">{t("phone")}</label>
            <Input id="u-phone" type="tel" placeholder="255712345678" {...register("phoneNumber")} className={errors.phoneNumber ? "border-destructive" : ""} />
            {errors.phoneNumber && <p className="mt-1 text-xs text-destructive">{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("role")}</label>
            <Select defaultValue="USER" onValueChange={(v) => setValue("role", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("user")}</SelectItem>
                <SelectItem value="ADMIN">{t("admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {t("save")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>{t("cancel")}</Button>
          </div>
        </form>
      )}

      {isLoading ? <SkeletonTable rows={4} cols={5} /> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("emailAddress")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("phone")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("role")}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("noData")}</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(u.firstName?.[0] || u.email?.[0] || "U").toUpperCase()}
                    </div>
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                      onClick={() => { if (window.confirm(t("confirmDelete"))) deleteMutation.mutate(u.id); }}
                      disabled={deleteMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
