// File: src/pages/admin/ServicesTab.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { servicesApi, languagesApi } from "@/lib/api";
import { serviceSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const makeDefaultValues = (langs = []) => ({
  status: "active",
  translations: langs.length
    ? langs.map((l) => ({ languageId: l.id, title: "", description: "", offers: [""] }))
    : [{ languageId: "", title: "", description: "", offers: [""] }],
});

export const ServicesTab = () => {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: servicesData, isLoading, isError } = useQuery({
    queryKey: ["admin-services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const { data: langsData } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const langs = langsData || [];
  const services = servicesData || [];

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: makeDefaultValues(langs),
  });

  const { fields: transFields, append: appendTrans, remove: removeTrans } = useFieldArray({
    control, name: "translations",
  });

  const createMutation = useMutation({
    mutationFn: (payload) => servicesApi.create(payload),
    onSuccess: () => { toast.success("Service created!"); qc.invalidateQueries(["admin-services"]); qc.invalidateQueries(["services"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to create service"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => servicesApi.update(id, payload),
    onSuccess: () => { toast.success("Service updated!"); qc.invalidateQueries(["admin-services"]); qc.invalidateQueries(["services"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to update service"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesApi.delete(id),
    onSuccess: () => { toast.success("Service deleted."); qc.invalidateQueries(["admin-services"]); qc.invalidateQueries(["services"]); },
    onError: (e) => toast.error(e?.message || "Failed to delete service"),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset(makeDefaultValues(langs)); };

  const onEdit = (service) => {
    setEditing(service);
    reset({
      status: service.status || "active",
      translations: service.translations?.length ? service.translations.map((tr) => ({
        languageId: tr.language?.id || tr.languageId || "",
        title: tr.title || "",
        description: tr.description || "",
        offers: tr.offers?.length ? tr.offers : [""],
      })) : [{ languageId: "", title: "", description: "", offers: [""] }],
    });
    setShowForm(true);
  };

  const onSubmit = (values) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: values });
    else createMutation.mutate(values);
  };

  const getFirstTrans = (s) => s?.translations?.[0];

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("servicesManagement")}</h2>
        <Button size="sm" onClick={() => { closeForm(); reset(makeDefaultValues(langs)); setShowForm(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("addNew")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-5 space-y-5" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{editing ? t("edit") : t("addNew")} Service</h3>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("status")}</label>
            <Select defaultValue="active" onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="notActive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{t("translations")}</p>
              <Button type="button" variant="outline" size="sm"
                onClick={() => appendTrans({ languageId: "", title: "", description: "", offers: [""] })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {t("addTranslation")}
              </Button>
            </div>

            {transFields.map((field, idx) => {
              const selectedLang = langs.find(l => l.id == watch(`translations.${idx}.languageId`));
              return (
                <div key={field.id} className="rounded-lg border border-border p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {selectedLang ? `${selectedLang.name} (${selectedLang.code})` : `Translation #${idx + 1}`}
                    </p>
                    {transFields.length > 1 && (
                      <button type="button" onClick={() => removeTrans(idx)} className="text-destructive hover:opacity-80">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                {/* Language */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("selectLanguage")}</label>
                  <Select
                    value={field.languageId?.toString() || ""}
                    onValueChange={(v) => setValue(`translations.${idx}.languageId`, v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={errors?.translations?.[idx]?.languageId ? "border-destructive" : ""}>
                      <SelectValue placeholder={t("selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {langs.map((l) => (
                        <SelectItem key={l.id} value={l.id?.toString()}>{l.name} ({l.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.translations?.[idx]?.languageId && (
                    <p className="mt-1 text-xs text-destructive">{errors.translations[idx].languageId.message}</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("title")}</label>
                  <Input placeholder="e.g. Tax Consultation" {...register(`translations.${idx}.title`)}
                    className={errors?.translations?.[idx]?.title ? "border-destructive" : ""} />
                  {errors?.translations?.[idx]?.title && (
                    <p className="mt-1 text-xs text-destructive">{errors.translations[idx].title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("description")}</label>
                  <Textarea placeholder="Service description..." rows={2} {...register(`translations.${idx}.description`)}
                    className={errors?.translations?.[idx]?.description ? "border-destructive" : ""} />
                  {errors?.translations?.[idx]?.description && (
                    <p className="mt-1 text-xs text-destructive">{errors.translations[idx].description.message}</p>
                  )}
                </div>

                {/* Offers (dynamic array) */}
                <OffersField control={control} nestIndex={idx} register={register} setValue={setValue} errors={errors} t={t} />
              </div>
            );
          })}
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

      {isLoading ? <SkeletonTable rows={4} cols={4} /> : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2 border border-destructive/20 bg-destructive/5 rounded-xl">
          <p className="text-sm font-medium">Failed to load services</p>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries(["admin-services"])}>Try Again</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("title")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("translations")}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("noData")}</td></tr>
              ) : services.map((s) => {
                const tr = getFirstTrans(s);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{tr?.title || `Service #${s.id}`}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status === "notActive" ? "INACTIVE" : s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.translations?.length || 0} lang(s)</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => { if (window.confirm(t("confirmDelete"))) deleteMutation.mutate(s.id); }}
                        disabled={deleteMutation.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Sub-component for dynamic offers array inside each translation
const OffersField = ({ control, nestIndex, register, setValue, errors, t }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `translations.${nestIndex}.offers` });
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-foreground">{t("offer")}s</label>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => append("")}>
          <Plus className="h-3 w-3 mr-1" /> {t("addOffer")}
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <Input placeholder={`Offer ${i + 1}`} {...register(`translations.${nestIndex}.offers.${i}`)}
              className={errors?.translations?.[nestIndex]?.offers?.[i] ? "border-destructive" : ""} />
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-destructive hover:opacity-80">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {errors?.translations?.[nestIndex]?.offers && (
        <p className="mt-1 text-xs text-destructive">At least one offer is required</p>
      )}
    </div>
  );
};
