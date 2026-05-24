// File: src/pages/admin/LanguagesTab.jsx
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Search, Filter,
  MoreVertical, CheckCircle2, Globe,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { languagesApi } from "@/lib/api";
import { languageSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { cn, formatDateDistance } from "@/lib/utils";
import { useResponseDialog } from "@/components/ui/response-dialog";

const makeDefault = () => ({ name: "", code: "", nativeName: "", flag: "" });

export const LanguagesTab = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, showDialog] = useResponseDialog();
  // After adding a new language, prompt admin to fill translations
  const [pendingLocale, setPendingLocale] = useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const languages = data || [];

  const filteredLanguages = useMemo(() =>
    languages.filter(l =>
      `${l.name} ${l.code} ${l.nativeName}`.toLowerCase().includes(searchQuery.toLowerCase())
    ), [languages, searchQuery]);

  const totalPages = Math.ceil(filteredLanguages.length / rowsPerPage);
  const paginatedLanguages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLanguages.slice(start, start + rowsPerPage);
  }, [filteredLanguages, currentPage, rowsPerPage]);

  const showingStart = filteredLanguages.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredLanguages.length);

  // ── Form ────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(languageSchema),
    defaultValues: makeDefault(),
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => languagesApi.create(payload),
    onSuccess: (res) => {
      toast.success("Language created successfully!");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
      closeForm();
      // If backend says translations need to be filled, prompt the admin
      const newLang = res?.data;
      if (newLang?.code) {
        setPendingLocale({ code: newLang.code, name: newLang.name, flag: newLang.flag });
      }
    },
    onError: (e) => toast.error(e?.message || "Failed to create language"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => languagesApi.update(id, payload),
    onSuccess: () => {
      toast.success("Language updated!");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
      closeForm();
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

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => languagesApi.bulkDelete(ids),
    onSuccess: () => {
      toast.success("Languages deleted.");
      qc.invalidateQueries(["admin-languages"]);
      qc.invalidateQueries(["languages"]);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete languages"),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const closeForm = () => { setShowForm(false); setEditing(null); reset(makeDefault()); };

  const onEdit = (lang) => {
    setEditing(lang);
    reset({ name: lang.name, code: lang.code, nativeName: lang.nativeName, flag: lang.flag || "" });
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: values });
    else createMutation.mutate(values);
  };

  // ── Select All ──────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    const pageIds = paginatedLanguages.map(l => l.id);
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
          title={t("languages")}
          breadcrumbs={[
            { label: "Languages", path: "/admin/languages" },
            { label: "List" },
          ]}
        >
          <Button onClick={() => { closeForm(); setShowForm(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> {t("addNew")}
          </Button>
        </ContentHeader>

        {/* Fill-translations prompt banner — shown after new language created */}
        {pendingLocale && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between animate-in slide-in-from-top-4 duration-400">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pendingLocale.flag && <span className="mr-1">{pendingLocale.flag}</span>}
                  {pendingLocale.name} added — please fill in translations
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All content keys were auto-seeded with <strong>missing</strong> status. English defaults will show until you translate them.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setPendingLocale(null)}
              >
                Later
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs shadow-md shadow-primary/20"
                onClick={() => {
                  setPendingLocale(null);
                  // Navigate to ContentTranslationsTab — dispatch custom event read by Admin.jsx
                  window.dispatchEvent(
                    new CustomEvent("admin-navigate-tab", {
                      detail: { tab: "contentTranslations", locale: pendingLocale.code },
                    })
                  );
                }}
              >
                Fill Translations Now →
              </Button>
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/20">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search languages..."
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
                      title: `Delete ${selectedIds.length} Language(s)?`,
                      subtitle: "This action cannot be undone. All selected languages will be permanently removed.",
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
              <Button variant="outline" size="sm" className="rounded-lg">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? <SkeletonTable rows={5} cols={6} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/30 accent-primary"
                        disabled={paginatedLanguages.length === 0}
                        checked={paginatedLanguages.length > 0 && paginatedLanguages.every(l => selectedIds.includes(l.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("name")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Code</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("nativeName")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Flag</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLanguages.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedLanguages.map((lang, index) => (
                    <tr key={lang.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(lang.id) && "bg-primary/5")}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-muted-foreground/30 accent-primary"
                          checked={selectedIds.includes(lang.id)}
                          onChange={() => toggleSelect(lang.id)}
                        />
                      </td>
                      <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                            <Globe className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-foreground">{lang.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide">
                          {lang.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{lang.nativeName}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {lang.flag ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-base">{lang.flag}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          ref={(el) => (actionBtnRefs.current[lang.id] = el)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + window.scrollY + 4,
                              right: window.innerWidth - rect.right,
                            });
                            setShowActionMenu(showActionMenu === lang.id ? null : lang.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredLanguages.length}</span> languages
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
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4"
            noValidate
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Language</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: t("name"),         field: "name",       placeholder: "English",  required: true  },
                { label: "Language Code",   field: "code",       placeholder: "en",        required: true  },
                { label: t("nativeName"),   field: "nativeName", placeholder: "English",  required: true  },
                { label: "Flag / Emoji",    field: "flag",       placeholder: "🇬🇧",        required: false },
              ].map(({ label, field, placeholder, required }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {label}{required && <span className="text-destructive ml-0.5">*</span>}
                  </label>
                  <Input
                    placeholder={placeholder}
                    {...register(field)}
                    className={errors[field] ? "border-destructive" : "rounded-xl"}
                  />
                  {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field].message}</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
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

      {/* Action Dropdown — Portal */}
      {showActionMenu !== null && createPortal(
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowActionMenu(null)} />
          <div
            className="fixed z-[9998] w-44 rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            <button
              onClick={() => {
                const lang = paginatedLanguages.find(l => l.id === showActionMenu);
                if (lang) onEdit(lang);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Language</span>
            </button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Language?",
                  subtitle: "This action cannot be undone. The language will be permanently removed.",
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
