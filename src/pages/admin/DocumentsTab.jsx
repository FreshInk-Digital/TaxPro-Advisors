// File: src/pages/admin/DocumentsTab.jsx
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Search, Filter,
  MoreVertical, CheckCircle2, FileText, Globe, Eye, UploadCloud,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FolderOpen, Download, Calendar, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { documentsApi, documentTypesApi, languagesApi } from "@/lib/api";
import { documentSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { cn } from "@/lib/utils";
import { useResponseDialog } from "@/components/ui/response-dialog";

export const DocumentsTab = () => {
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
  const [selectedFile, setSelectedFile] = useState(null);

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

  const { data: dtData, isLoading: isLoadingDt } = useQuery({
    queryKey: ["admin-document-types"],
    queryFn: async () => {
      const res = await documentTypesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const documentTypes = dtData || [];

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const res = await documentsApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const documents = documentsData || [];

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const q = searchQuery.toLowerCase();
      const inStatus = doc.status?.toLowerCase().includes(q);
      const inTrans = doc.translations?.some(tr => 
        tr.title?.toLowerCase().includes(q) || tr.description?.toLowerCase().includes(q)
      );
      const inDt = doc.document_type?.translations?.some(tr => tr.name?.toLowerCase().includes(q));
      return inStatus || inTrans || inDt;
    });
  }, [documents, searchQuery]);

  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDocuments.slice(start, start + rowsPerPage);
  }, [filteredDocuments, currentPage, rowsPerPage]);

  const showingStart = filteredDocuments.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredDocuments.length);

  // ── Form ────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(documentSchema),
    defaultValues: { status: "active", documentTypeId: "", custom_file_name: "", translations: [] },
  });

  const { fields: translationFields } = useFieldArray({
    control,
    name: "translations",
  });

  const initializeForm = (editingDoc = null) => {
    setSelectedFile(null);
    if (editingDoc) {
      const existingTrans = editingDoc.translations || [];
      const populatedTrans = languages.map(lang => {
        const found = existingTrans.find(t => t.languageId === lang.id);
        return { 
          languageId: lang.id, 
          title: found ? found.title : "",
          description: found ? found.description : ""
        };
      });
      reset({ 
        status: editingDoc.status || "active", 
        documentTypeId: String(editingDoc.documentTypeId || editingDoc.document_type_id || ""),
        custom_file_name: editingDoc.custom_file_name || "",
        translations: populatedTrans 
      });
    } else {
      const emptyTrans = languages.map(lang => ({ languageId: lang.id, title: "", description: "" }));
      reset({ status: "active", documentTypeId: "", custom_file_name: "", translations: emptyTrans });
    }
  };

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData) => documentsApi.create(formData),
    onSuccess: () => {
      toast.success("Document created successfully!");
      qc.invalidateQueries(["admin-documents"]);
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to create document"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => documentsApi.update(id, formData),
    onSuccess: () => {
      toast.success("Document updated!");
      qc.invalidateQueries(["admin-documents"]);
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to update document"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => documentsApi.delete(id),
    onSuccess: () => {
      toast.success("Document deleted.");
      qc.invalidateQueries(["admin-documents"]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete document"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => documentsApi.delete(id))),
    onSuccess: () => {
      toast.success("Documents deleted.");
      qc.invalidateQueries(["admin-documents"]);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete documents"),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const closeForm = () => { setShowForm(false); setEditing(null); setSelectedFile(null); };
  const closeView = () => { setViewingTranslations(null); };

  const onEdit = (doc) => {
    setEditing(doc);
    initializeForm(doc);
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onView = (doc) => {
    setViewingTranslations(doc);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    if (!editing && !selectedFile) {
      toast.error("Please select a document file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("documentTypeId", values.documentTypeId);
    formData.append("status", values.status);
    if (values.custom_file_name) formData.append("custom_file_name", values.custom_file_name);

    values.translations.forEach((t, i) => {
      formData.append(`translations[${i}][languageId]`, t.languageId);
      formData.append(`translations[${i}][title]`, t.title);
      formData.append(`translations[${i}][description]`, t.description);
    });

    if (selectedFile) {
      formData.append("document", selectedFile);
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, formData });
    } else {
      createMutation.mutate(formData);
    }
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title={t("documents") || "Documents"}
          breadcrumbs={[
            { label: "Documents", path: "/admin/documents" },
            { label: "List" },
          ]}
        >
          <Button onClick={() => { initializeForm(); setShowForm(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> {t("addNew")}
          </Button>
        </ContentHeader>

        {/* Table Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/20">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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
                      title: `Delete ${selectedIds.length} Document(s)?`,
                      subtitle: "This action cannot be undone. All selected files will be permanently removed.",
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
            <div className="flex items-center gap-3">
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
          </div>

          {/* Table */}
          {isLoading || isLoadingLanguages || isLoadingDt ? <SkeletonTable rows={5} cols={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/30 accent-primary"
                        disabled={paginatedData.length === 0}
                        checked={paginatedData.length > 0 && paginatedData.every(doc => selectedIds.includes(doc.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Document</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Type</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Created At</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedData.map((doc, index) => {
                    const titleToShow = doc.translations?.find(t => t.language?.code === "en")?.title 
                      || doc.translations?.[0]?.title 
                      || doc.custom_file_name 
                      || "Unnamed Document";
                      
                    const typeName = doc.type || `Type #${doc.documentTypeId}`;

                    return (
                      <tr key={doc.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(doc.id) && "bg-primary/5")}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-muted-foreground/30 accent-primary"
                            checked={selectedIds.includes(doc.id)}
                            onChange={() => toggleSelect(doc.id)}
                          />
                        </td>
                        <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                              <FolderOpen className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{titleToShow}</span>
                              {doc.documentUrl ? (
                                <a 
                                  href={doc.downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer font-bold"
                                >
                                  <Download className="h-3 w-3" /> Download File
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic mt-0.5">No file available</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide">
                            {typeName}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={doc.status === "active" ? "default" : "secondary"} className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                            {doc.status === "notActive" ? "INACTIVE" : doc.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            ref={(el) => (actionBtnRefs.current[doc.id] = el)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + window.scrollY + 4,
                                right: window.innerWidth - rect.right,
                              });
                              setShowActionMenu(showActionMenu === doc.id ? null : doc.id);
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

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredDocuments.length}</span> documents
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
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
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronsRight className="h-4 w-4" />
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
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto"
            noValidate
          >
            <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Document</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Type <span className="text-destructive ml-0.5">*</span></label>
                <Controller
                  name="documentTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={field.onChange}>
                      <SelectTrigger className={cn("rounded-xl w-full", errors.documentTypeId && "border-destructive")}>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {documentTypes.map(dt => {
                          const name = dt.translations?.find(t => t.language?.code === "en")?.name || dt.translations?.[0]?.name || `Type #${dt.id}`;
                          return <SelectItem key={dt.id} value={String(dt.id)}>{name}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.documentTypeId && <p className="mt-1 text-xs text-destructive">{errors.documentTypeId.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl w-full">
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
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom File Name (Optional)</label>
              <Input placeholder="my-document.pdf" {...register("custom_file_name")} className="rounded-xl" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document File {editing ? "(Optional - Upload to replace)" : <span className="text-destructive ml-0.5">*</span>}
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/10 transition-colors">
                <Input 
                  type="file" 
                  className="hidden" 
                  id="documentFile"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0])}
                />
                <label htmlFor="documentFile" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-primary">Click to select a file</span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, XLS, Images (Max: 20MB)</span>
                  {selectedFile && <Badge variant="secondary" className="mt-2">{selectedFile.name}</Badge>}
                  {editing && !selectedFile && <span className="text-xs italic text-muted-foreground mt-1">Current file will be kept.</span>}
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Translations
              </h4>
              {errors.translations?.root && (
                <p className="text-xs text-destructive">{errors.translations.root.message}</p>
              )}
              {translationFields.map((field, index) => {
                const lang = languages.find(l => l.id === field.languageId);
                return (
                  <div key={field.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                      <span className="text-lg">{lang?.flag || "🌐"}</span>
                      <span className="font-medium text-sm">{lang?.name} <Badge variant="secondary" className="ml-1 text-[10px]">{lang?.code}</Badge></span>
                    </div>
                    {/* Hidden Language ID */}
                    <input type="hidden" {...register(`translations.${index}.languageId`)} />
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Title <span className="text-destructive ml-0.5">*</span></label>
                        <Input
                          placeholder={`Title in ${lang?.name}`}
                          {...register(`translations.${index}.title`)}
                          className={errors.translations?.[index]?.title ? "border-destructive" : "rounded-xl"}
                        />
                        {errors.translations?.[index]?.title && (
                          <p className="mt-1 text-xs text-destructive">{errors.translations[index].title.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description <span className="text-destructive ml-0.5">*</span></label>
                        <textarea
                          placeholder={`Description in ${lang?.name}`}
                          {...register(`translations.${index}.description`)}
                          className={cn("flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50", errors.translations?.[index]?.description && "border-destructive")}
                        />
                        {errors.translations?.[index]?.description && (
                          <p className="mt-1 text-xs text-destructive">{errors.translations[index].description.message}</p>
                        )}
                      </div>
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

      {/* View Translations Modal — Portal */}
      {viewingTranslations && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" /> Document Details
              </h3>
              <button onClick={closeView} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Meta Section */}
              <div className="grid grid-cols-2 gap-4 pb-5 border-b border-border">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Created By
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {viewingTranslations.createdBy
                        ? `${viewingTranslations.createdBy.firstName} ${viewingTranslations.createdBy.lastName}`
                        : <span className="text-muted-foreground italic text-xs">Unknown</span>
                      }
                    </span>
                    {viewingTranslations.createdBy?.email && (
                      <span className="text-xs text-muted-foreground">{viewingTranslations.createdBy.email}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created At
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {viewingTranslations.createdAt
                      ? new Date(viewingTranslations.createdAt).toLocaleDateString("en-GB", { 
                          day: "2-digit", 
                          month: "short", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Document Type
                  </span>
                  <Badge variant="outline" className="w-fit text-xs font-semibold py-1 px-3">
                    {viewingTranslations.type || "N/A"}
                  </Badge>
                </div>
              </div>

              {/* Translations Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> Content Translations
                </h4>
              {viewingTranslations.translations?.map((tr, i) => {
                const lang = languages.find(l => l.id === tr.languageId);
                return (
                  <div key={i} className="flex flex-col border-b border-border last:border-0 pb-4 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                       {lang?.name || tr.language?.name || `Lang ID ${tr.languageId}`}
                       {(lang?.code || tr.language?.code) && <Badge variant="outline" className="text-[9px] px-1 py-0">{lang?.code || tr.language?.code}</Badge>}
                    </span>
                    <span className="font-semibold text-foreground mb-1">{tr.title}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr.description}</p>
                  </div>
                );
              })}
              {(!viewingTranslations.translations || viewingTranslations.translations.length === 0) && (
                <p className="text-center text-muted-foreground italic py-4">No translations available.</p>
              )}
              </div>
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
                const doc = paginatedData.find(d => d.id === showActionMenu);
                if (doc && doc.downloadUrl) {
                  window.open(doc.downloadUrl, '_blank');
                } else {
                  toast.error("Download link not available");
                }
                setShowActionMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Download File</span>
            </button>
            <button
              onClick={() => {
                const doc = paginatedData.find(d => d.id === showActionMenu);
                if (doc) onView(doc);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>View Translations</span>
            </button>
            <button
              onClick={() => {
                const doc = paginatedData.find(d => d.id === showActionMenu);
                if (doc) onEdit(doc);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Document</span>
            </button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Document?",
                  subtitle: "This action cannot be undone. The document will be permanently removed.",
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
