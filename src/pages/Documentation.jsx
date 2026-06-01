import { useMemo, useState } from "react";
import { Search, FileText, Eye, Download, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { documentsApi, getDocumentDownloadUrl, getDocumentPreviewUrl } from "@/lib/api";
import { SkeletonCard } from "@/components/ui/skeleton";

const ALL_CATEGORY_ID = "all";

function getTranslation(doc, lang) {
  const translations = doc?.translations || [];
  return (
    (doc?.translation?.title ? doc.translation : null) ||
    translations.find((tr) => tr?.language?.code === lang) ||
    translations.find((tr) => tr?.language?.code === "en") ||
    translations[0] ||
    null
  );
}

function getCaseCodeValue(doc) {
  const raw = doc?.caseCode ?? doc?.case_code ?? doc?.id;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
}

const Documentation = () => {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID);
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
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

  const categories = useMemo(() => {
    const counts = documents.reduce((acc, doc) => {
      const type = doc?.type || "";
      if (!type) return acc;
      acc.set(type, (acc.get(type) || 0) + 1);
      return acc;
    }, new Map());

    return [
      { id: ALL_CATEGORY_ID, label: t("allDocuments"), count: documents.length },
      ...Array.from(counts.entries()).map(([type, count]) => ({
        id: type,
        label: type,
        count,
      })),
    ];
  }, [documents, t]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...documents]
      .sort((a, b) => {
        const diff = getCaseCodeValue(a) - getCaseCodeValue(b);
        return sortDirection === "asc" ? diff : -diff;
      })
      .filter((doc) => {
        const tr = getTranslation(doc, lang);
        const matchesSearch =
          !query ||
          tr?.title?.toLowerCase().includes(query) ||
          tr?.description?.toLowerCase().includes(query) ||
          doc.type?.toLowerCase().includes(query) ||
          String(doc.caseCode ?? doc.case_code ?? doc.id).toLowerCase().includes(query);
        const matchesCategory = activeCategory === ALL_CATEGORY_ID || doc.type === activeCategory;
        return matchesSearch && matchesCategory;
      });
  }, [documents, lang, search, sortDirection, activeCategory]);

  return (
    <div className="py-16">
      <div className="container">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold text-foreground">{t("docTitle")}</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{t("docDesc")}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchDocs")}
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className="justify-center gap-2 rounded-xl lg:w-auto"
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            type="button"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{t("sortByCaseCode")}</span>
            <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider">
              {sortDirection.toUpperCase()}
            </Badge>
          </Button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-6 h-fit">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("categories")}
            </p>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    activeCategory === category.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                  type="button"
                >
                  <span className="truncate">{category.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{category.count}</span>
                </button>
              ))}
            </div>
          </aside>

          <section>
            {isLoading ? (
              <SkeletonCard count={4} />
            ) : isError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
                Could not load documents. Please try again later.
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                {t("noData")}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const tr = getTranslation(doc, lang);
                  const downloadUrl = getDocumentDownloadUrl(doc);
                  const previewUrl = getDocumentPreviewUrl(doc);
                  const caseCode = doc?.caseCode ?? doc?.case_code ?? `#${doc.id}`;

                  return (
                    <article key={doc.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                            <FileText className="h-5 w-5 text-secondary-foreground" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">
                                {tr?.title || `Document #${doc.id}`}
                              </h3>
                              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                                {t("caseCode")} {caseCode}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{doc.type || "Document"}</span>
                              <span>•</span>
                              <span>
                                {doc.createdAt
                                  ? new Date(doc.createdAt).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Available"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            {sortDirection === "asc" ? "ASC" : "DESC"}
                          </Badge>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {tr?.description || ""}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2 sm:max-w-sm">
                        <Button variant="outline" size="sm" disabled={!downloadUrl} asChild={!!downloadUrl}>
                          {downloadUrl ? (
                            <a href={downloadUrl} target="_blank" rel="noreferrer" download>
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              {t("download")}
                            </a>
                          ) : (
                            <span>
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              {t("download")}
                            </span>
                          )}
                        </Button>

                        <Button variant="outline" size="sm" disabled={!previewUrl} asChild={!!previewUrl}>
                          {previewUrl ? (
                            <a href={previewUrl} target="_blank" rel="noreferrer">
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              {t("preview")}
                            </a>
                          ) : (
                            <span>
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              {t("preview")}
                            </span>
                          )}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
