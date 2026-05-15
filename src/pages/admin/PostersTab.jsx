// File: src/pages/admin/PostersTab.jsx
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, X, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { postersApi, languagesApi } from "@/lib/api";
import { posterSchema } from "@/lib/schemas";
import { SkeletonPosters } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const makeDefault = (langs = []) => ({
  status: "ACTIVE",
  custom_file_name: "",
  translations: langs.length
    ? langs.map((l) => ({ languageId: l.id, title: "", description: "" }))
    : [{ languageId: "", title: "", description: "" }],
});

export const PostersTab = () => {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  const { data: postersData, isLoading, isError } = useQuery({
    queryKey: ["admin-posters", lang],
    queryFn: async () => {
      const res = await postersApi.list(lang);
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
  const posters = postersData || [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(posterSchema),
    defaultValues: makeDefault(langs),
  });

  const transFields = watch("translations") || [];

  const buildFormData = (values) => {
    const fd = new FormData();
    fd.append("status", values.status);
    if (values.custom_file_name) fd.append("custom_file_name", values.custom_file_name);
    if (imageFile) fd.append("image", imageFile);
    values.translations.forEach((tr, idx) => {
      fd.append(`translations[${idx}][languageId]`, tr.languageId);
      fd.append(`translations[${idx}][title]`, tr.title);
      fd.append(`translations[${idx}][description]`, tr.description);
    });
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: (fd) => postersApi.create(fd),
    onSuccess: () => { toast.success("Poster created!"); qc.invalidateQueries(["admin-posters"]); qc.invalidateQueries(["posters"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to create poster"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => postersApi.update(id, fd),
    onSuccess: () => { toast.success("Poster updated!"); qc.invalidateQueries(["admin-posters"]); qc.invalidateQueries(["posters"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to update poster"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => postersApi.delete(id),
    onSuccess: () => { toast.success("Poster deleted."); qc.invalidateQueries(["admin-posters"]); },
    onError: (e) => toast.error(e?.message || "Failed to delete poster"),
  });

  const closeForm = () => {
    setShowForm(false); setEditing(null); setImageFile(null); setImagePreview(null); reset(makeDefault(langs));
  };

  const onEdit = (poster) => {
    setEditing(poster);
    reset({
      status: poster.status || "ACTIVE",
      custom_file_name: poster.custom_file_name || "",
      translations: poster.translations?.length
        ? poster.translations.map((tr) => ({ languageId: tr.language?.id || tr.languageId || "", title: tr.title || "", description: tr.description || "" }))
        : [{ languageId: "", title: "", description: "" }],
    });
    setImagePreview(poster.image_url || null);
    setShowForm(true);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = (values) => {
    if (!imageFile && !editing) {
      toast.error("Please select an image to upload.");
      return;
    }
    const fd = buildFormData(values);
    if (editing) updateMutation.mutate({ id: editing.id, fd });
    else createMutation.mutate(fd);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Posters</h2>
        <Button size="sm" onClick={() => { closeForm(); reset(makeDefault(langs)); setShowForm(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("addNew")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-5 space-y-5" noValidate encType="multipart/form-data">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{editing ? t("edit") : t("addNew")} Poster</h3>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("uploadImage")} {!editing && <span className="text-destructive">*</span>}
            </label>
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-8 cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, SVG, WebP (max 10MB)</p>
                </>
              )}
              <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp" onChange={onFileChange} />
            </div>
          </div>

          {/* Status + custom name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("status")}</label>
              <Select defaultValue="ACTIVE" onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="poster-fname" className="mb-1.5 block text-sm font-medium text-foreground">{t("customFileName")}</label>
              <Input id="poster-fname" placeholder="promo-2026.jpg" {...register("custom_file_name")} />
            </div>
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{t("translations")}</p>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setValue("translations", [...transFields, { languageId: "", title: "", description: "" }])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {t("addTranslation")}
              </Button>
            </div>
            {transFields.map((tr, idx) => {
              const selectedLang = langs.find(l => l.id == tr.languageId);
              return (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {selectedLang ? `${selectedLang.name} (${selectedLang.code})` : `Translation #${idx + 1}`}
                    </p>
                    {transFields.length > 1 && (
                      <button type="button" onClick={() => setValue("translations", transFields.filter((_, i) => i !== idx))} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("selectLanguage")}</label>
                  <Select value={tr.languageId?.toString() || ""}
                    onValueChange={(v) => { const updated = [...transFields]; updated[idx] = { ...updated[idx], languageId: v }; setValue("translations", updated, { shouldValidate: true }); }}>
                    <SelectTrigger><SelectValue placeholder={t("selectLanguage")} /></SelectTrigger>
                    <SelectContent>
                      {langs.map((l) => <SelectItem key={l.id} value={l.id?.toString()}>{l.name} ({l.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("title")}</label>
                  <Input placeholder="e.g. Promo 2026" {...register(`translations.${idx}.title`)} />
                  {errors?.translations?.[idx]?.title && <p className="mt-1 text-xs text-destructive">{errors.translations[idx].title.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">{t("description")}</label>
                  <Textarea placeholder="Poster description..." rows={2} {...register(`translations.${idx}.description`)} />
                  {errors?.translations?.[idx]?.description && <p className="mt-1 text-xs text-destructive">{errors.translations[idx].description.message}</p>}
                </div>
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

      {isLoading ? <SkeletonPosters count={6} /> : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2 border border-destructive/20 bg-destructive/5 rounded-xl">
          <p className="text-sm font-medium">Failed to load posters</p>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries(["admin-posters"])}>Try Again</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {posters.length === 0 ? (
            <p className="col-span-full py-8 text-center text-muted-foreground">{t("noData")}</p>
          ) : posters.map((poster) => {
            const tr = poster.translations?.[0];
            return (
              <div key={poster.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="h-36 bg-muted flex items-center justify-center relative overflow-hidden">
                  {poster.image_url ? (
                    <img src={poster.image_url} alt={tr?.title || ""} className="h-full w-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                  <Badge className="absolute top-2 right-2" variant={poster.status === "ACTIVE" ? "default" : "secondary"}>
                    {poster.status}
                  </Badge>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1">{tr?.title || `Poster #${poster.id}`}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tr?.description}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(poster)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit")}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                      onClick={() => { if (window.confirm(t("confirmDelete"))) deleteMutation.mutate(poster.id); }}
                      disabled={deleteMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
