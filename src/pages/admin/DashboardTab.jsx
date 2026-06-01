// File: src/pages/admin/DashboardTab.jsx
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, MessageSquare, Globe, TrendingUp } from "lucide-react";
import { serviceRequestsApi, servicesApi, postersApi, languagesApi } from "@/lib/api";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContentHeader } from "@/components/admin/ContentHeader";

export const DashboardTab = ({ onNavigateTab }) => {
  const { t, lang } = useLanguage();

  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ["admin-service-requests"],
    queryFn: async () => {
      const res = await serviceRequestsApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const { data: services, isLoading: loadingSvcs } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const res = await servicesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const { data: posters, isLoading: loadingPosters } = useQuery({
    queryKey: ["admin-posters"],
    queryFn: async () => {
      const res = await postersApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const { data: langs, isLoading: loadingLangs } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const isLoading = loadingReqs || loadingSvcs || loadingPosters || loadingLangs;

  const getServiceId = (request) => request?.serviceId ?? request?.service_id ?? request?.service?.id ?? null;

  const getTranslationLanguageCode = (translation) => translation?.language?.code;

  const getServiceTitle = (service, fallbackId = null) => {
    const translations = service?.translations || [];
    return service?.translation?.title
      || translations.find((tr) => getTranslationLanguageCode(tr) === lang)?.title
      || translations.find((tr) => getTranslationLanguageCode(tr) === "en")?.title
      || translations[0]?.title
      || service?.title
      || service?.name
      || (fallbackId ? `Service #${fallbackId}` : "—");
  };

  const getRequestService = (request) => {
    const serviceId = getServiceId(request);
    return request?.service || services?.find((service) => Number(service.id) === Number(serviceId));
  };

  const getRequestServiceTitle = (request) =>
    request?.serviceName
    || request?.service_name
    || request?.serviceTitle
    || request?.service_title
    || getServiceTitle(getRequestService(request), getServiceId(request));

  const stats = [
    {
      label: t("totalRequests"),
      value: requests?.length,
      loading: loadingReqs,
      icon: MessageSquare,
      change: "From API",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: t("publishedPages"),
      value: Array.isArray(services)
        ? services.filter((s) => s && s.status === "active").length
        : undefined,
      loading: loadingSvcs,
      icon: TrendingUp,
      change: "Active services",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: t("postersUploaded"),
      value: posters?.length,
      loading: loadingPosters,
      icon: FileText,
      change: "Total posters",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: t("activeLanguages"),
      value: langs?.length,
      loading: loadingLangs,
      icon: Globe,
      change: "Supported languages",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  // Removed full page skeleton to allow partial loading for better UX

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ContentHeader 
        title={t("dashboard")}
        breadcrumbs={[]} // Home/Dashboard is default
      />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
            {stat.loading ? (
              <div className="h-9 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-3xl font-extrabold text-foreground">{stat.value ?? 0}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Service Requests</h2>
        </div>
        <div className="overflow-x-auto">
          {loadingReqs || loadingSvcs ? (
            <div className="p-8 space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Name</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Email</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Service</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(!requests || requests.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                      {t("noData")}
                    </td>
                  </tr>
                ) : (
                  requests.slice(0, 5).map((req) => {
                    if (!req) return null;
                    return (
                      <tr key={req.id || Math.random()} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {req.fullName || req.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">
                          {req.email || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/10">
                            {getRequestServiceTitle(req)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {req.createdAt || req.created_at ? new Date(req.createdAt || req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-muted/10 px-6 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => onNavigateTab?.("requests")}
            className="text-xs font-bold text-primary hover:underline"
          >
            View all requests
          </button>
        </div>
      </div>
    </div>
  );
};
