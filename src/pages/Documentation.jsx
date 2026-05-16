// File: src/pages/Documentation.jsx
import { useState } from "react";
import { Search, FileText, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { documentsApi, resolveAssetUrl } from "@/lib/api";
import { SkeletonCard } from "@/components/ui/skeleton";

const getDocumentDownloadUrl = (doc) =>
  resolveAssetUrl(doc?.downloadUrl || doc?.download_url || doc?.file_url || doc?.documentUrl || doc?.document_url);

const getDocumentFileUrl = (doc) =>
  resolveAssetUrl(doc?.documentUrl || doc?.document_url || doc?.file_url || doc?.downloadUrl || doc?.download_url);

const Documentation = () => {
  const [activeCategory, setActiveCategory] = useState("All Documents");
  const [search, setSearch] = useState("");
  const { t, lang } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents", lang],
    queryFn: async () => {
      const res = await documentsApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const documents = data || [];

  const getTranslation = (doc) => {
    const translations = doc?.translations || [];
    return (
      (doc?.translation?.title ? doc.translation : null) ||
      translations.find((tr) => tr?.language?.code === lang) ||
      translations.find((tr) => tr?.language?.code === "en") ||
      translations[0] ||
      null
    );
  };

  const categories = [
    { name: "All Documents", count: documents.length },
    ...Array.from(new Set(documents.map((doc) => doc.type).filter(Boolean))).map((type) => ({
      name: type,
      count: documents.filter((doc) => doc.type === type).length,
    })),
  ];

  const filtered = documents.filter(
    (doc) => {
      const tr = getTranslation(doc);
      const q = search.toLowerCase();
      const matchesSearch = tr?.title?.toLowerCase().includes(q)
        || tr?.description?.toLowerCase().includes(q)
        || doc.type?.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "All Documents" || doc.type === activeCategory;
      return matchesSearch && matchesCategory;
    }
  );

  return (
    <div className="py-16">
      <div className="container">
        <h1 className="text-4xl font-extrabold text-foreground">{t("docTitle")}</h1>
        <p className="mt-4 max-w-lg text-muted-foreground">{t("docDesc")}</p>

        <div className="mt-8 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("searchDocs")} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[200px_1fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("categories")}</p>
            <div className="space-y-1">
              {categories.map((c) => (
                <button key={c.name} onClick={() => setActiveCategory(c.name)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${activeCategory === c.name ? "bg-secondary font-semibold text-secondary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {c.name}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <SkeletonCard count={4} />
          ) : isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
              Could not load documents. Please try again later.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.length === 0 ? (
                <div className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </div>
              ) : filtered.map((doc) => {
                const tr = getTranslation(doc);
                const downloadUrl = getDocumentDownloadUrl(doc);
                const fileUrl = getDocumentFileUrl(doc);
                return (
                  <div key={doc.id} className="rounded-xl border border-border bg-card p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <FileText className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{tr?.title || `Document #${doc.id}`}</h3>
                        <p className="text-xs text-muted-foreground">{doc.type || "Document"} · {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Available"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">{tr?.description || ""}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" disabled={!downloadUrl} asChild={!!downloadUrl}>
                        {downloadUrl ? (
                          <a href={downloadUrl} target="_blank" rel="noreferrer" download><Download className="mr-1.5 h-3.5 w-3.5" /> {t("download")}</a>
                        ) : (
                          <span><Download className="mr-1.5 h-3.5 w-3.5" /> {t("download")}</span>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" disabled={!fileUrl} asChild={!!fileUrl}>
                        {fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noreferrer"><Eye className="mr-1.5 h-3.5 w-3.5" /> {t("preview")}</a>
                        ) : (
                          <span><Eye className="mr-1.5 h-3.5 w-3.5" /> {t("preview")}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
