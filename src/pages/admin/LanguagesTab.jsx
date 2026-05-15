// File: src/pages/admin/LanguagesTab.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { languagesApi } from "@/lib/api";
import { languageSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultValues = { name: "", code: "", nativeName: "", flag: "" };

export const LanguagesTab = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // language object being edited
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(languageSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => languagesApi.create(payload),
    onSuccess: () => {
      toast.success("Language created successfully!");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
      reset(defaultValues);
      setShowForm(false);
    },
    onError: (e) => toast.error(e?.message || "Failed to create language"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => languagesApi.update(id, payload),
    onSuccess: () => {
      toast.success("Language updated!");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
      reset(defaultValues);
      setEditing(null);
      setShowForm(false);
    },
    onError: (e) => toast.error(e?.message || "Failed to update language"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => languagesApi.delete(id),
    onSuccess: () => {
      toast.success("Language deleted.");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete language"),
  });

  const onEdit = (lang) => {
    setEditing(lang);
    reset({ name: lang.name, code: lang.code, nativeName: lang.nativeName, flag: lang.flag || "" });
    setShowForm(true);
  };

  const onSubmit = (values) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const languages = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("languages")}</h2>
        <Button size="sm" onClick={() => { setEditing(null); reset(defaultValues); setShowForm(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("addNew")}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-5 space-y-4" noValidate>
          <h3 className="font-semibold text-foreground">{editing ? t("edit") : t("addNew")} Language</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "lang-name", label: t("name"), field: "name", placeholder: "English" },
              { id: "lang-code", label: t("languageCode"), field: "code", placeholder: "en" },
              { id: "lang-native", label: t("nativeName"), field: "nativeName", placeholder: "English" },
              { id: "lang-flag", label: t("flagCode"), field: "flag", placeholder: "gb" },
            ].map(({ id, label, field, placeholder }) => (
              <div key={field}>
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
                <Input id={id} placeholder={placeholder} {...register(field)}
                  className={errors[field] ? "border-destructive" : ""} />
                {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field].message}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {t("save")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null); reset(defaultValues); }}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      {isLoading ? <SkeletonTable rows={4} cols={5} /> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("nativeName")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flag</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {languages.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("noData")}</td></tr>
              ) : languages.map((lang) => (
                <tr key={lang.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" /> {lang.name}
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary">{lang.code}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{lang.nativeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lang.flag}</td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(lang)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                      onClick={() => { if (window.confirm(t("confirmDelete"))) deleteMutation.mutate(lang.id); }}
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
