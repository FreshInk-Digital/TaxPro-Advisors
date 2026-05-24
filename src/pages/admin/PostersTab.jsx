// File: src/pages/admin/PostersTab.jsx
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Download, Eye, Globe, Image, Loader2, MoreVertical, Pencil, Plus, Search,
  Trash2, UploadCloud, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { useResponseDialog } from "@/components/ui/response-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPosterPreviewUrl, languagesApi, postersApi } from "@/lib/api";
import { posterSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const getPosterImageUrl = (poster) => getPosterPreviewUrl(poster);

export const PostersTab = () => {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingPoster, setViewingPoster] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, showDialog] = useResponseDialog();

  const { data: languagesData, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const languages = languagesData || [];

  const { data: postersData, isLoading, isError } = useQuery({
    queryKey: ["admin-posters", lang],
    queryFn: async () => {
      const res = await postersApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const posters = postersData || [];

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(posterSchema),
    defaultValues: { status: "active", custom_file_name: "", translations: [] },
  });
  const { fields: translationFields } = useFieldArray({ control, name: "translations" });

  const getLanguage = (languageId) => languages.find(item => Number(item.id) === Number(languageId));

  const getPosterTitle = (poster) => {
    const translations = poster?.translations || [];
    return translations.find(tr => getLanguage(tr.languageId)?.code === lang)?.title
      || translations.find(tr => getLanguage(tr.languageId)?.code === "en")?.title
      || translations[0]?.title
      || `Poster #${poster?.id}`;
  };

  const filteredPosters = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return posters.filter(poster => {
      const inStatus = poster.status?.toLowerCase().includes(q);
      const inTrans = poster.translations?.some(tr =>
        tr.title?.toLowerCase().includes(q) || tr.description?.toLowerCase().includes(q)
      );
      return inStatus || inTrans;
    });
  }, [posters, searchQuery]);

  const totalPages = Math.ceil(filteredPosters.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPosters.slice(start, start + rowsPerPage);
  }, [filteredPosters, currentPage, rowsPerPage]);
  const showingStart = filteredPosters.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredPosters.length);

  const initializeForm = (poster = null) => {
    setImageFile(null);
    setImagePreview(poster ? getPosterImageUrl(poster) : null);
    if (poster) {
      const existingTrans = poster.translations || [];
      reset({
        status: poster.status || "active",
        custom_file_name: poster.custom_file_name || "",
        translations: languages.map(language => {
          const found = existingTrans.find(tr => Number(tr.languageId) === Number(language.id));
          return {
            languageId: language.id,
            title: found?.title || "",
            description: found?.description || "",
          };
        }),
      });
    } else {
      reset({
        status: "active",
        custom_file_name: "",
        translations: languages.map(language => ({ languageId: language.id, title: "", description: "" })),
      });
    }
  };

  const buildFormData = (values) => {
    const fd = new FormData();
    fd.append("status", values.status);
    if (values.custom_file_name) fd.append("custom_file_name", values.custom_file_name);
    if (imageFile) fd.append("image", imageFile);
    values.translations.forEach((tr, index) => {
      fd.append(`translations[${index}][languageId]`, tr.languageId);
      fd.append(`translations[${index}][title]`, tr.title);
      fd.append(`translations[${index}][description]`, tr.description || "");
    });
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: (fd) => postersApi.create(fd),
    onSuccess: () => {
      toast.success("Poster created successfully!");
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["posters"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to create poster"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => postersApi.update(id, fd),
    onSuccess: () => {
      toast.success("Poster updated!");
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["posters"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to update poster"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => postersApi.delete(id),
    onSuccess: () => {
      toast.success("Poster deleted.");
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["posters"] });
    },
    onError: (e) => toast.error(e?.message || "Failed to delete poster"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => postersApi.bulkDelete(ids),
    onSuccess: () => {
      toast.success("Posters deleted.");
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["posters"] });
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete posters"),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    reset({ status: "active", custom_file_name: "", translations: [] });
  };
  const closeView = () => setViewingPoster(null);

  const onEdit = (poster) => {
    setEditing(poster);
    initializeForm(poster);
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onView = (poster) => {
    setViewingPoster(poster);
    setShowActionMenu(null);
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = (values) => {
    if (!editing && !imageFile) {
      toast.error("Please select an image to upload.");
      return;
    }
    const fd = buildFormData(values);
    if (editing) updateMutation.mutate({ id: editing.id, fd });
    else createMutation.mutate(fd);
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(poster => poster.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title={t("contentPosters") || "Posters"}
          breadcrumbs={[{ label: "Posters", path: "/admin/posters" }, { label: "List" }]}
        >
          <Button onClick={() => { initializeForm(); setShowForm(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> {t("addNew")}
          </Button>
        </ContentHeader>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/20">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search posters..."
                  className="pl-10 rounded-xl bg-background border-border"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl animate-in slide-in-from-left-2 duration-300"
                  onClick={async () => {
                    const ok = await showDialog({
                      variant: "confirm",
                      title: `Delete ${selectedIds.length} Poster(s)?`,
                      subtitle: "This action cannot be undone. All selected posters will be permanently removed.",
                      confirmLabel: "Delete All",
                      cancelLabel: "Cancel",
                    });
                    if (ok) bulkDeleteMutation.mutate(selectedIds);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-20 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading || isLoadingLanguages ? <SkeletonTable rows={5} cols={6} /> : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2">
              <p className="text-sm font-medium">Failed to load posters</p>
              <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-posters"] })}>Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input type="checkbox" className="rounded border-muted-foreground/30 accent-primary" disabled={paginatedData.length === 0} checked={paginatedData.length > 0 && paginatedData.every(poster => selectedIds.includes(poster.id))} onChange={toggleSelectAll} />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Poster</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Preview</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Created At</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedData.map((poster, index) => {
                    const imageUrl = getPosterImageUrl(poster);
                    return (
                      <tr key={poster.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(poster.id) && "bg-primary/5")}>
                        <td className="px-4 py-4">
                          <input type="checkbox" className="rounded border-muted-foreground/30 accent-primary" checked={selectedIds.includes(poster.id)} onChange={() => toggleSelect(poster.id)} />
                        </td>
                        <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                              <Image className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-foreground">{getPosterTitle(poster)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {imageUrl ? (
                            <img src={imageUrl} alt={getPosterTitle(poster)} className="h-16 w-16 rounded-lg object-contain border border-border bg-muted" />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No image</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={poster.status === "active" ? "default" : "secondary"} className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                            {poster.status === "notActive" ? "INACTIVE" : poster.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">
                          {poster.createdAt ? new Date(poster.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            ref={(el) => (actionBtnRefs.current[poster.id] = el)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                              setShowActionMenu(showActionMenu === poster.id ? null : poster.id);
                            }}
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredPosters.length}</span> posters</p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return <Button key={pageNum} variant={currentPage === pageNum ? "primary" : "outline"} size="sm" className={cn("h-8 w-8 rounded-lg p-0", currentPage === pageNum && "bg-primary text-primary-foreground hover:bg-primary/90")} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>;
                })}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto" noValidate encType="multipart/form-data">
            <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Poster</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl w-full"><SelectValue placeholder="Select Status" /></SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="active">ACTIVE</SelectItem>
                        <SelectItem value="notActive">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom File Name</label>
                <Input placeholder="promo-2026" {...register("custom_file_name")} className="rounded-xl" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Poster Image {editing ? "(Optional - Upload to replace)" : <span className="text-destructive ml-0.5">*</span>}
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/10 transition-colors">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp" onChange={onFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Poster preview" className="max-h-56 w-full rounded-lg object-contain" />
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-primary">Click to select an image</span>
                      <span className="text-xs text-muted-foreground">JPEG, PNG, GIF, SVG, WebP (Max: 10MB)</span>
                    </>
                  )}
                  {imageFile && <Badge variant="secondary" className="mt-2">{imageFile.name}</Badge>}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Translations</h4>
              {translationFields.map((field, index) => {
                const language = getLanguage(field.languageId);
                return (
                  <div key={field.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                      <span className="text-lg">{language?.flag || "🌐"}</span>
                      <span className="font-medium text-sm">{language?.name} <Badge variant="secondary" className="ml-1 text-[10px]">{language?.code}</Badge></span>
                    </div>
                    <input type="hidden" {...register(`translations.${index}.languageId`)} />
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Title <span className="text-destructive ml-0.5">*</span></label>
                      <Input {...register(`translations.${index}.title`)} className={errors.translations?.[index]?.title ? "border-destructive" : "rounded-xl"} />
                      {errors.translations?.[index]?.title && <p className="mt-1 text-xs text-destructive">{errors.translations[index].title.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description <span className="text-destructive ml-0.5">*</span></label>
                      <textarea
                        {...register(`translations.${index}.description`)}
                        className={cn("flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", errors.translations?.[index]?.description && "border-destructive")}
                      />
                      {errors.translations?.[index]?.description && <p className="mt-1 text-xs text-destructive">{errors.translations[index].description.message}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-card border-t border-border mt-4 pb-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={closeForm}>{t("cancel")}</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t("save")}
              </Button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {viewingPoster && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Image className="h-5 w-5 text-primary" /> Poster Details</h3>
              <button onClick={closeView} className="rounded-full p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-5 max-h-[70vh] overflow-y-auto">
              {getPosterImageUrl(viewingPoster) && <img src={getPosterImageUrl(viewingPoster)} alt={getPosterTitle(viewingPoster)} className="w-full max-h-72 rounded-xl object-contain bg-muted" />}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Created At</span>
                  <span className="text-sm font-semibold text-foreground">{viewingPoster.createdAt ? new Date(viewingPoster.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                  <Badge variant={viewingPoster.status === "active" ? "default" : "secondary"} className="w-fit">{viewingPoster.status === "notActive" ? "INACTIVE" : viewingPoster.status}</Badge>
                </div>
              </div>
              {viewingPoster.translations?.map((tr, index) => {
                const language = getLanguage(tr.languageId);
                return (
                  <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      {language?.name || `Lang ID ${tr.languageId}`}
                      {language?.code && <Badge variant="outline" className="text-[9px] px-1 py-0">{language.code}</Badge>}
                    </span>
                    <p className="font-semibold text-foreground">{tr.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tr.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6"><Button className="w-full rounded-xl" onClick={closeView}>Close</Button></div>
          </div>
        </div>,
        document.body
      )}

      {showActionMenu !== null && createPortal(
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowActionMenu(null)} />
          <div className="fixed z-[9998] w-48 rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ top: menuPosition.top, right: menuPosition.right }}>
            <button onClick={() => { const poster = paginatedData.find(item => item.id === showActionMenu); if (poster) onView(poster); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"><Eye className="h-3.5 w-3.5 text-muted-foreground" /><span>View Details</span></button>
            <button
              onClick={() => {
                const poster = paginatedData.find(item => item.id === showActionMenu);
                const imageUrl = getPosterImageUrl(poster);
                if (imageUrl) window.open(imageUrl, "_blank");
                else toast.error("Poster file not available");
                setShowActionMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-primary" /><span>Open File</span>
            </button>
            <button onClick={() => { const poster = paginatedData.find(item => item.id === showActionMenu); if (poster) onEdit(poster); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /><span>Edit Poster</span></button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Poster?",
                  subtitle: "This action cannot be undone. The poster will be permanently removed.",
                  confirmLabel: "Delete",
                  cancelLabel: "Cancel",
                });
                if (ok) deleteMutation.mutate(id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /><span>Delete</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {dialog}
    </>
  );
};
