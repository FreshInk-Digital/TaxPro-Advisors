// File: src/pages/admin/ServicesTab.jsx
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, Globe, Loader2, MoreVertical, Pencil, Plus, Search, Trash2, X,
  BriefcaseBusiness, Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { useResponseDialog } from "@/components/ui/response-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { languagesApi, servicesApi } from "@/lib/api";
import { serviceSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export const ServicesTab = () => {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingService, setViewingService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
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

  const { data: servicesData, isLoading, isError } = useQuery({
    queryKey: ["admin-services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const services = servicesData || [];

  const { register, handleSubmit, reset, control, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { status: "active", translations: [] },
  });

  const { fields: translationFields } = useFieldArray({ control, name: "translations" });

  const getLanguage = (languageId) => languages.find(l => Number(l.id) === Number(languageId));

  const getServiceTitle = (service) => {
    const translations = service?.translations || [];
    return translations.find(tr => getLanguage(tr.languageId)?.code === lang)?.title
      || translations.find(tr => getLanguage(tr.languageId)?.code === "en")?.title
      || translations[0]?.title
      || `Service #${service?.id}`;
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return services.filter(service => {
      const inStatus = service.status?.toLowerCase().includes(q);
      const inTrans = service.translations?.some(tr =>
        tr.title?.toLowerCase().includes(q)
        || tr.description?.toLowerCase().includes(q)
        || tr.offers?.some(offer => offer?.toLowerCase().includes(q))
      );
      return inStatus || inTrans;
    });
  }, [services, searchQuery]);

  const totalPages = Math.ceil(filteredServices.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredServices.slice(start, start + rowsPerPage);
  }, [filteredServices, currentPage, rowsPerPage]);
  const showingStart = filteredServices.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredServices.length);

  const initializeForm = (service = null) => {
    if (service) {
      const existingTrans = service.translations || [];
      const offerCount = Math.max(1, ...existingTrans.map(tr => tr.offers?.length || 0));
      reset({
        status: service.status || "active",
        translations: languages.map(language => {
          const found = existingTrans.find(tr => Number(tr.languageId) === Number(language.id));
          return {
            languageId: language.id,
            title: found?.title || "",
            description: found?.description || "",
            offers: Array.from({ length: offerCount }, (_, index) => found?.offers?.[index] || ""),
          };
        }),
      });
    } else {
      reset({
        status: "active",
        translations: languages.map(language => ({
          languageId: language.id,
          title: "",
          description: "",
          offers: [""],
        })),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload) => servicesApi.create(payload),
    onSuccess: () => {
      toast.success("Service created successfully!");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to create service"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => servicesApi.update(id, payload),
    onSuccess: () => {
      toast.success("Service updated!");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to update service"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesApi.delete(id),
    onSuccess: () => {
      toast.success("Service deleted.");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e) => toast.error(e?.message || "Failed to delete service"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => servicesApi.bulkDelete(ids),
    onSuccess: () => {
      toast.success("Services deleted.");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete services"),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset({ status: "active", translations: [] }); };
  const closeView = () => setViewingService(null);

  const onEdit = (service) => {
    setEditing(service);
    initializeForm(service);
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onView = (service) => {
    setViewingService(service);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    const payload = {
      ...values,
      translations: values.translations.map(tr => ({
        ...tr,
        offers: tr.offers.map(offer => offer.trim()),
      })),
    };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const addOfferToAllTranslations = () => {
    const translations = watch("translations") || [];
    setValue(
      "translations",
      translations.map(translation => ({
        ...translation,
        offers: [...(translation.offers || []), ""],
      })),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const removeOfferFromAllTranslations = (offerIndex) => {
    const translations = watch("translations") || [];
    setValue(
      "translations",
      translations.map(translation => ({
        ...translation,
        offers: (translation.offers || []).filter((_, index) => index !== offerIndex),
      })),
      { shouldDirty: true, shouldValidate: true }
    );
    trigger("translations");
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(service => service.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title={t("servicesManagement") || "Services"}
          breadcrumbs={[{ label: "Services", path: "/admin/services" }, { label: "List" }]}
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
                  placeholder="Search services..."
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
                      title: `Delete ${selectedIds.length} Service(s)?`,
                      subtitle: "This action cannot be undone. All selected services will be permanently removed.",
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
              <p className="text-sm font-medium">Failed to load services</p>
              <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-services"] })}>Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/30 accent-primary"
                        disabled={paginatedData.length === 0}
                        checked={paginatedData.length > 0 && paginatedData.every(service => selectedIds.includes(service.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Service</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Translations</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Created At</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedData.map((service, index) => (
                    <tr key={service.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(service.id) && "bg-primary/5")}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-muted-foreground/30 accent-primary"
                          checked={selectedIds.includes(service.id)}
                          onChange={() => toggleSelect(service.id)}
                        />
                      </td>
                      <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <BriefcaseBusiness className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-foreground">{getServiceTitle(service)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{service.translations?.length || 0} lang(s)</td>
                      <td className="px-4 py-4">
                        <Badge variant={service.status === "active" ? "default" : "secondary"} className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                          {service.status === "notActive" ? "INACTIVE" : service.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">
                        {service.createdAt ? new Date(service.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          ref={(el) => (actionBtnRefs.current[service.id] = el)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                            setShowActionMenu(showActionMenu === service.id ? null : service.id);
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

          <div className="flex flex-col gap-4 border-t border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredServices.length}</span> services
            </p>
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
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto"
            noValidate
          >
            <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Service</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

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

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Translations
                </h4>
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={addOfferToAllTranslations}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Offer
                </Button>
              </div>
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
                      <Textarea rows={3} {...register(`translations.${index}.description`)} className={errors.translations?.[index]?.description ? "border-destructive" : "rounded-xl"} />
                      {errors.translations?.[index]?.description && <p className="mt-1 text-xs text-destructive">{errors.translations[index].description.message}</p>}
                    </div>
                    <OffersField
                      nestIndex={index}
                      register={register}
                      errors={errors}
                      offerCount={watch(`translations.${index}.offers`)?.length || 0}
                      onRemoveOffer={removeOfferFromAllTranslations}
                    />
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

      {viewingService && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-primary" /> Service Details</h3>
              <button onClick={closeView} className="rounded-full p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Created At</span>
                  <span className="text-sm font-semibold text-foreground">{viewingService.createdAt ? new Date(viewingService.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                  <Badge variant={viewingService.status === "active" ? "default" : "secondary"} className="w-fit">{viewingService.status === "notActive" ? "INACTIVE" : viewingService.status}</Badge>
                </div>
              </div>
              {viewingService.translations?.map((tr, index) => {
                const language = getLanguage(tr.languageId);
                return (
                  <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      {language?.name || `Lang ID ${tr.languageId}`}
                      {language?.code && <Badge variant="outline" className="text-[9px] px-1 py-0">{language.code}</Badge>}
                    </span>
                    <p className="font-semibold text-foreground">{tr.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tr.description}</p>
                    {tr.offers?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tr.offers.map((offer, i) => <Badge key={i} variant="secondary" className="text-[10px]">{offer}</Badge>)}
                      </div>
                    )}
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
          <div
            className="fixed z-[9998] w-48 rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            <button onClick={() => { const service = paginatedData.find(item => item.id === showActionMenu); if (service) onView(service); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /><span>View Details</span>
            </button>
            <button onClick={() => { const service = paginatedData.find(item => item.id === showActionMenu); if (service) onEdit(service); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /><span>Edit Service</span>
            </button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Service?",
                  subtitle: "This action cannot be undone. The service will be permanently removed.",
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

const OffersField = ({ nestIndex, register, errors, offerCount, onRemoveOffer }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Offers</label>
      </div>
      <div className="space-y-2">
        {Array.from({ length: Math.max(1, offerCount) }, (_, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Offer ${index + 1}`}
              {...register(`translations.${nestIndex}.offers.${index}`)}
              className={errors?.translations?.[nestIndex]?.offers?.[index] ? "border-destructive" : "rounded-xl"}
            />
            {offerCount > 1 && (
              <button type="button" onClick={() => onRemoveOffer(index)} className="rounded-lg px-2 text-destructive hover:bg-destructive/10">
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
