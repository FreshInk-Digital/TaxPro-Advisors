// File: src/pages/admin/RequestsTab.jsx
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, Loader2, Mail, MoreVertical, Pencil, Phone, Plus, Search, Trash2, User,
  X,
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
import { getToken, languagesApi, serviceRequestsApi, servicesApi } from "@/lib/api";
import { serviceRequestSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const normalizeLocale = (locale) => locale === "sw" ? "sw" : "en";

export const RequestsTab = () => {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, showDialog] = useResponseDialog();
  const hasAdminToken = !!getToken();

  const { data: languagesData } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const languages = languagesData || [];

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["admin-services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const services = servicesData || [];

  const { data: requestsData, isLoading, isError } = useQuery({
    queryKey: ["admin-service-requests", lang],
    queryFn: async () => {
      const res = await serviceRequestsApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    enabled: hasAdminToken,
    retry: (failureCount, error) => error?.status !== 401 && failureCount < 1,
    refetchInterval: 30000,
  });
  const requests = requestsData || [];

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: { serviceId: "", fullName: "", email: "", phone: "", message: "", locale: normalizeLocale(lang) },
  });

  const getLanguage = (languageId) => languages.find(item => Number(item.id) === Number(languageId));

  const getServiceId = (request) => request?.serviceId ?? request?.service_id ?? request?.service?.id ?? null;

  const getTranslationLanguageCode = (translation) =>
    translation?.language?.code || getLanguage(translation?.languageId ?? translation?.language_id)?.code;

  const getServiceTitle = (service, fallbackId = null) => {
    const translations = service?.translations || [];
    return service?.translation?.title
      || translations.find(tr => getTranslationLanguageCode(tr) === lang)?.title
      || translations.find(tr => getTranslationLanguageCode(tr) === "en")?.title
      || translations[0]?.title
      || service?.title
      || service?.name
      || (fallbackId ? `Service #${fallbackId}` : "—");
  };

  const getRequestService = (request) => {
    const serviceId = getServiceId(request);
    return request?.service || services.find(service => Number(service.id) === Number(serviceId));
  };

  const getRequestServiceTitle = (request) =>
    request?.serviceName
    || request?.service_name
    || request?.serviceTitle
    || request?.service_title
    || getServiceTitle(getRequestService(request), getServiceId(request));

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return requests.filter(request => {
      const serviceTitle = getRequestServiceTitle(request).toLowerCase();
      return request.fullName?.toLowerCase().includes(q)
        || request.email?.toLowerCase().includes(q)
        || request.phone?.toLowerCase().includes(q)
        || request.message?.toLowerCase().includes(q)
        || request.locale?.toLowerCase().includes(q)
        || serviceTitle.includes(q);
    });
  }, [requests, searchQuery, services, languages, lang]);

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, currentPage, rowsPerPage]);
  const showingStart = filteredRequests.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredRequests.length);

  const initializeForm = (request = null) => {
    reset({
      serviceId: getServiceId(request) ? String(getServiceId(request)) : "",
      fullName: request?.fullName || "",
      email: request?.email || "",
      phone: request?.phone || "",
      message: request?.message || "",
      locale: normalizeLocale(request?.locale || lang),
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => serviceRequestsApi.create(payload),
    onSuccess: () => {
      toast.success("Service request created successfully!");
      qc.invalidateQueries({ queryKey: ["admin-service-requests"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to create service request"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => serviceRequestsApi.update(id, payload),
    onSuccess: () => {
      toast.success("Service request updated!");
      qc.invalidateQueries({ queryKey: ["admin-service-requests"] });
      closeForm();
    },
    onError: (e) => toast.error(e?.message || "Failed to update service request"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => serviceRequestsApi.delete(id),
    onSuccess: () => {
      toast.success("Service request deleted.");
      qc.invalidateQueries({ queryKey: ["admin-service-requests"] });
    },
    onError: (e) => toast.error(e?.message || "Failed to delete service request"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => serviceRequestsApi.bulkDelete(ids),
    onSuccess: () => {
      toast.success("Service requests deleted.");
      qc.invalidateQueries({ queryKey: ["admin-service-requests"] });
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e?.message || "Failed to delete service requests"),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset({ serviceId: "", fullName: "", email: "", phone: "", message: "", locale: normalizeLocale(lang) }); };
  const closeView = () => setViewingRequest(null);

  const onEdit = (request) => {
    setEditing(request);
    initializeForm(request);
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onView = (request) => {
    setViewingRequest(request);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    const payload = { ...values, locale: normalizeLocale(values.locale || lang) };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(request => request.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
  };
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title={t("serviceRequests") || "Service Requests"}
          breadcrumbs={[{ label: "Service Requests", path: "/admin/requests" }, { label: "List" }]}
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
                <Input placeholder="Search requests..." className="pl-10 rounded-xl bg-background border-border" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl animate-in slide-in-from-left-2 duration-300"
                  onClick={async () => {
                    const ok = await showDialog({
                      variant: "confirm",
                      title: `Delete ${selectedIds.length} Request(s)?`,
                      subtitle: "This action cannot be undone. All selected requests will be permanently removed.",
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

          {!hasAdminToken ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <User className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Admin session required</p>
                <p className="mt-1 text-sm text-muted-foreground">Please sign in again to view service requests.</p>
              </div>
              <Button asChild>
                <a href="/admin/login">Sign In</a>
              </Button>
            </div>
          ) : isLoading || isLoadingServices ? <SkeletonTable rows={5} cols={7} /> : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2">
              <p className="text-sm font-medium">Failed to load service requests.</p>
              <p className="max-w-md text-center text-xs text-muted-foreground">
                If this continues, sign out and sign in again so a fresh admin token is sent with the request.
              </p>
              <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-service-requests"] })}>Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4"><input type="checkbox" className="rounded border-muted-foreground/30 accent-primary" disabled={paginatedData.length === 0} checked={paginatedData.length > 0 && paginatedData.every(request => selectedIds.includes(request.id))} onChange={toggleSelectAll} /></th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Client</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Contact</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Service</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Locale</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Date</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedData.map((request, index) => (
                    <tr key={request.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(request.id) && "bg-primary/5")}>
                      <td className="px-4 py-4"><input type="checkbox" className="rounded border-muted-foreground/30 accent-primary" checked={selectedIds.includes(request.id)} onChange={() => toggleSelect(request.id)} /></td>
                      <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/10"><User className="h-4 w-4" /></div>
                          <span className="font-semibold text-foreground">{request.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {request.email}</span>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {request.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{getRequestServiceTitle(request)}</td>
                      <td className="px-4 py-4"><Badge variant="outline" className="uppercase">{request.locale || "en"}</Badge></td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">{request.created_at || request.createdAt ? new Date(request.created_at || request.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          ref={(el) => (actionBtnRefs.current[request.id] = el)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                            setShowActionMenu(showActionMenu === request.id ? null : request.id);
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
            <p>Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredRequests.length}</span> requests</p>
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
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto" noValidate>
            <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} Service Request</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Service <span className="text-destructive ml-0.5">*</span></label>
              <Controller
                name="serviceId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                    <SelectTrigger className={cn("rounded-xl w-full", errors.serviceId && "border-destructive")}><SelectValue placeholder="Select Service" /></SelectTrigger>
                    <SelectContent className="z-[10001]">
                      {services.map(service => <SelectItem key={service.id} value={String(service.id)}>{getServiceTitle(service, service.id)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceId && <p className="mt-1 text-xs text-destructive">{errors.serviceId.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name <span className="text-destructive ml-0.5">*</span></label>
                <Input {...register("fullName")} className={errors.fullName ? "border-destructive" : "rounded-xl"} />
                {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Locale</label>
                <Controller
                  name="locale"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || "en"} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl w-full"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email <span className="text-destructive ml-0.5">*</span></label>
                <Input type="email" {...register("email")} className={errors.email ? "border-destructive" : "rounded-xl"} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone <span className="text-destructive ml-0.5">*</span></label>
                <Input type="tel" {...register("phone")} className={errors.phone ? "border-destructive" : "rounded-xl"} />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Message <span className="text-destructive ml-0.5">*</span></label>
              <Textarea rows={4} {...register("message")} className={errors.message ? "border-destructive" : "rounded-xl"} />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
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

      {viewingRequest && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Request Details</h3>
              <button onClick={closeView} className="rounded-full p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Client</span>
                  <p className="text-sm font-semibold text-foreground">{viewingRequest.fullName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
                  <p className="text-sm font-semibold text-foreground">{viewingRequest.created_at || viewingRequest.createdAt ? new Date(viewingRequest.created_at || viewingRequest.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                  <p className="mt-1 text-sm text-foreground">{viewingRequest.email}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</span>
                  <p className="mt-1 text-sm text-foreground">{viewingRequest.phone}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/10 p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service</span>
                <p className="mt-1 text-sm font-semibold text-foreground">{getRequestServiceTitle(viewingRequest)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</span>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewingRequest.message || "—"}</p>
              </div>
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
            <button onClick={() => { const request = paginatedData.find(item => item.id === showActionMenu); if (request) onView(request); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"><Eye className="h-3.5 w-3.5 text-muted-foreground" /><span>View Details</span></button>
            <button onClick={() => { const request = paginatedData.find(item => item.id === showActionMenu); if (request) onEdit(request); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /><span>Edit Request</span></button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({
                  variant: "confirm",
                  title: "Delete Service Request?",
                  subtitle: "This action cannot be undone. The request will be permanently removed.",
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
