// File: src/pages/admin/RequestsTab.jsx
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serviceRequestsApi } from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export const RequestsTab = () => {
  const { t } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-service-requests"],
    queryFn: async () => {
      const res = await serviceRequestsApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const requests = data || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{t("serviceRequests")}</h2>

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load service requests.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Locale</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {t("noData")}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{req.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {req.service?.translations?.[0]?.title || `Service #${req.serviceId}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{req.locale || "en"}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
