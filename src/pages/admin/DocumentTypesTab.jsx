// File: src/pages/admin/DocumentTypesTab.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Search,
  MoreVertical, CheckCircle2, FileText, Globe, Eye, Calendar, User,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { documentTypesApi, languagesApi } from "@/lib/api";
import { documentTypeSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { cn } from "@/lib/utils";
import { useResponseDialog } from "@/components/ui/response-dialog";

export const DocumentTypesTab = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingTranslations, setViewingTranslations] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, showDialog] = useResponseDialog();

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: languagesData, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const languages = languagesData || [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-document-types"],
    queryFn: async () => {
      const res = await documentTypesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const documentTypes = data || [];

  const filteredDocumentTypes = useMemo(() => {
    return documentTypes.filter(dt => {
      const q = searchQuery.toLowerCase();
      // Search in status or translations
      const inStatus = dt.status?.toLowerCase().includes(q);
      const inTrans = dt.translations?.some(tr => tr.name?.toLowerCase().includes(q));
      return inStatus || inTrans;
    });
  }, [documentTypes, searchQuery]);

  const totalPages = Math.ceil(filteredDocumentTypes.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDocumentTypes.slice(start, start + rowsPerPage);
  }, [filteredDocumentTypes, currentPage, rowsPerPage]);

  const showingStart = filteredDocumentTypes.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredDocumentTypes.length);

  // ── Form ────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: { status: "active", translations: [] },
  });

  const { fields: translationFields, replace: replaceTranslations } = useFieldArray({
    control,
    name: "translations",
  });

  const initializeForm = (editingDt = null) => {
    if (editingDt) {
      const existingTrans = editingDt.translations || [];
      const populatedTrans = languages.map(lang => {
        const found = existingTrans.find(t => t.languageId === lang.id);
        return { languageId: lang.id, name: found ? found.name : "" };
      });
      reset({ status: editingDt.status || "active", translations: populatedTrans });
    } else {
      const emptyTrans = languages.map(lang => ({ languageId: lang.id, name: "" }));
      reset({ status: "active", translations: emptyTrans });
    }
  };

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => documentTypesApi.create(payload),
    onSuccess: () => {
      toast.success("Document Type created successfully!");
      qc.invalidateQueries(["admin-document-types"]);
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to create document type"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => documentTypesApi.update(id, payload),
    onSuccess: () => {
      toast.success("Document Type updated!");
      qc.invalidateQueries(["admin-document-types"]);
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to update document type"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => documentTypesApi.delete(id),
    onSuccess: () => {
      toast.success("Document Type deleted.");
      qc.invalidateQueries(["admin-document-types"]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete document type"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => documentTypesApi.bulkDelete(ids),
    onSuccess: () => {
      toast.success("Document Types deleted.");
      qc.invalidateQueries(["admin-document-types"]);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete document types"),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const closeForm = () => { setShowForm(false); setEditing(null); reset({ status: "active", translations: [] }); };
  const closeView = () => { setViewingTranslations(null); };

  const onEdit = (dt) => {
    setEditing(dt);
    initializeForm(dt);
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onView = (dt) => {
    setViewingTranslations(dt);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: values });
    else createMutation.mutate(values);
  };

  // ── Select All ──────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(l => l.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <>
      <div className="space-y-6 duration-500 animate-in fade-in">
        <ContentHeader
          title="Document Types"
          breadcrumbs={[
            { label: "Document Types", path: "/admin/document-types" },
            { label: "List" },
          ]}
        >
          <Button onClick={() => { initializeForm(); setShowForm(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> {t("addNew")}
          </Button>
        </ContentHeader>

        {/* Table Card */}
        <div className="overflow-hidden border shadow-sm rounded-2xl border-border bg-card">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between border-border bg-muted/20">
            <div className="flex items-center flex-1 gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search document types..."
                  className="pl-10 rounded-xl bg-background border-border"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="duration-300 rounded-xl animate-in slide-in-from-left-2"
                  onClick={async () => {
                    const ok = await showDialog({
                      variant: "confirm",
                      title: `Delete ${selectedIds.length} Document Type(s)?`,
                      subtitle: "This action cannot be undone. All selected items will be permanently removed.",
                      confirmLabel: "Delete All",
                      cancelLabel: "Cancel",
                    });
                    if (ok) bulkDeleteMutation.mutate(selectedIds);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Show</span>
                <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20 rounded-lg h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading || isLoadingLanguages ? <SkeletonTable rows={5} cols={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/30 accent-primary"
                        disabled={paginatedData.length === 0}
                        checked={paginatedData.length > 0 && paginatedData.every(dt => selectedIds.includes(dt.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("name")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Created At</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 italic text-center text-muted-foreground">{t("noData")}</td></tr>
                  ) : paginatedData.map((dt, index) => {
                    // Try to show english or first available name
                    const nameToShow = dt.translations?.find(t => t.language?.code === "en")?.name 
                      || dt.translations?.[0]?.name 
                      || "Unnamed";
                    
                    return (
                      <tr key={dt.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(dt.id) && "bg-primary/5")}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-muted-foreground/30 accent-primary"
                            checked={selectedIds.includes(dt.id)}
                            onChange={() => toggleSelect(dt.id)}
                          />
                        </td>
                        <td className="px-2 py-4 font-medium text-muted-foreground">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center text-xs font-bold border rounded-full h-9 w-9 bg-primary/10 text-primary border-primary/10">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-foreground">{nameToShow}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={dt.status === "active" ? "default" : "secondary"} className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                            {dt.status === "notActive" ? "INACTIVE" : dt.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                          {dt.createdAt ? new Date(dt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            ref={(el) => (actionBtnRefs.current[dt.id] = el)}
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 rounded-full hover:bg-muted"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + window.scrollY + 4,
                                right: window.innerWidth - rect.right,
                              });
                              setShowActionMenu(showActionMenu === dt.id ? null : dt.id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-4 px-4 py-4 text-sm border-t border-border bg-muted/10 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredDocumentTypes.length}</span> document types
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      size="sm"
                      className={cn("h-8 w-8 rounded-lg p-0", currentPage === pageNum && "bg-primary text-primary-foreground hover:bg-primary/90")}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Form — Portal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto"
            noValidate
          >
            <div className="sticky top-0 z-10 flex items-center justify-between pb-4 border-b border-border bg-card">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Document Type</h3>
              <button type="button" onClick={closeForm} className="p-1 transition-colors rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      <SelectItem value="active">ACTIVE</SelectItem>
                      <SelectItem value="notActive">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="pt-2 space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="w-4 h-4 text-primary" /> Translations
              </h4>
              {errors.translations?.root && (
                <p className="text-xs text-destructive">{errors.translations.root.message}</p>
              )}
              {translationFields.map((field, index) => {
                const lang = languages.find(l => l.id === field.languageId);
                return (
                  <div key={field.id} className="p-3 space-y-3 border rounded-xl border-border bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{lang?.flag || "🌐"}</span>
                      <span className="text-sm font-medium">{lang?.name} <Badge variant="secondary" className="ml-1 text-[10px]">{lang?.code}</Badge></span>
                    </div>
                    {/* Hidden Language ID */}
                    <input type="hidden" {...register(`translations.${index}.languageId`)} />
                    
                    <div>
                      <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-muted-foreground">Name <span className="text-destructive ml-0.5">*</span></label>
                      <Input
                        placeholder={`Name in ${lang?.name}`}
                        {...register(`translations.${index}.name`)}
                        className={errors.translations?.[index]?.name ? "border-destructive" : "rounded-xl"}
                      />
                      {errors.translations?.[index]?.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.translations[index].name.message}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 flex gap-3 pt-4 pb-2 mt-4 border-t bg-card border-border">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={closeForm}>{t("cancel")}</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {t("save")}
              </Button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* View Translations Modal — Portal */}
      {viewingTranslations && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 duration-200 border shadow-2xl rounded-2xl border-border bg-card animate-in zoom-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Globe className="w-5 h-5 text-primary" /> Translations View
              </h3>
              <button onClick={closeView} className="p-1 transition-colors rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Meta info: createdBy + createdAt */}
              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-border">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Created By
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {viewingTranslations.createdBy
                      ? `${viewingTranslations.createdBy.firstName} ${viewingTranslations.createdBy.lastName}`
                      : <span className="text-xs italic text-muted-foreground">Unknown</span>
                    }
                  </span>
                  {viewingTranslations.createdBy?.email && (
                    <span className="text-xs text-muted-foreground">{viewingTranslations.createdBy.email}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created At
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {viewingTranslations.createdAt
                      ? new Date(viewingTranslations.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Translations */}
              {viewingTranslations.translations?.map((tr, i) => {
                const lang = languages.find(l => l.id === tr.languageId);
                return (
                  <div key={i} className="flex flex-col pb-3 border-b border-border last:border-0 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                       {lang?.name || tr.language?.name || `Lang ID ${tr.languageId}`}
                       {(lang?.code || tr.language?.code) && <Badge variant="outline" className="text-[9px] px-1 py-0">{lang?.code || tr.language?.code}</Badge>}
                    </span>
                    <span className="font-medium text-foreground">{tr.name}</span>
                  </div>
                );
              })}
              {(!viewingTranslations.translations || viewingTranslations.translations.length === 0) && (
                <p className="py-4 italic text-center text-muted-foreground">No translations available.</p>
              )}
            </div>

            <div className="mt-6">
              <Button className="w-full rounded-xl" onClick={closeView}>Close</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Action Dropdown — Portal */}
      {showActionMenu !== null && createPortal(
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowActionMenu(null)} />
          <div
            className="fixed z-[9998] w-48 rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            <button
              onClick={() => {
                const dt = paginatedData.find(d => d.id === showActionMenu);
                if (dt) onView(dt);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>View Translations</span>
            </button>
            <button
              onClick={() => {
                const dt = paginatedData.find(d => d.id === showActionMenu);
                if (dt) onEdit(dt);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Type</span>
            </button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Document Type?",
                  subtitle: "This action cannot be undone. The document type will be permanently removed.",
                  confirmLabel: "Delete",
                  cancelLabel: "Cancel",
                });
                if (ok) deleteMutation.mutate(id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Response / Confirm Dialog */}
      {dialog}
    </>
  );
};
