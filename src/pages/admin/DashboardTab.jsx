// File: src/pages/admin/DashboardTab.jsx
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, MessageSquare, Globe, TrendingUp } from "lucide-react";
import { serviceRequestsApi, servicesApi, postersApi, languagesApi } from "@/lib/api";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export const DashboardTab = () => {
  const { t } = useLanguage();

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

  const stats = [
    {
      label: t("totalRequests"),
      value: requests?.length ?? 0,
      icon: MessageSquare,
      change: "From API",
    },
    {
      label: t("publishedPages"),
      value: Array.isArray(services)
        ? services.filter((s) => s && s.status === "ACTIVE").length
        : 0,
      icon: TrendingUp,
      change: "Active services",
    },
    {
      label: t("postersUploaded"),
      value: posters?.length ?? 0,
      icon: FileText,
      change: "Total posters",
    },
    {
      label: t("activeLanguages"),
      value: langs?.length ?? 0,
      icon: Globe,
      change: "Supported languages",
    },
  ];

  if (isLoading) return <SkeletonDashboard />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{t("dashboard")}</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Service Requests</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {(!requests || requests.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {t("noData")}
                  </td>
                </tr>
              ) : (
                requests.slice(0, 5).map((req) => {
                  if (!req) return null;
                  return (
                    <tr key={req.id || Math.random()} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {req.fullName || req.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.service?.translations?.[0]?.title || req.serviceName || `Service #${req.serviceId || ""}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
