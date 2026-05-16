// File: src/pages/Posters.jsx
import { FileText, Download, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { postersApi, resolveAssetUrl } from "@/lib/api";
import { SkeletonPosters } from "@/components/ui/skeleton";

const getPosterFileUrl = (poster) => resolveAssetUrl(poster?.file_url || poster?.image_url || poster?.posterImage || poster?.image_path);

const Posters = () => {
  const { t, lang } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posters", lang],
    queryFn: async () => {
      const res = await postersApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const getTranslation = (poster) => {
    const translations = poster?.translations || [];
    return (
      translations.find((tr) => tr?.language?.code === lang) ||
      translations.find((tr) => tr?.language?.code === "en") ||
      translations[0] ||
      null
    );
  };

  const posters = data || [];

  return (
    <div className="py-16">
      <div className="container">
        <h1 className="text-4xl font-extrabold text-foreground">{t("postersTitle")}</h1>
        <p className="mt-4 max-w-lg text-muted-foreground">{t("postersPageDesc")}</p>

        <div className="mt-10">
          {isLoading ? (
            <SkeletonPosters count={8} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">Could not load posters. Please try again later.</p>
            </div>
          ) : posters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <FileText className="h-10 w-10" />
              <p className="text-sm">{t("noData")}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {posters.map((poster) => {
                const tr = getTranslation(poster);
                const posterUrl = getPosterFileUrl(poster);
                return (
                  <div
                    key={poster.id}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-muted">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={tr?.title || "Poster"}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      )}
                      <span className="absolute top-2 right-2 rounded bg-foreground/80 text-primary-foreground px-2 py-0.5 text-[10px] font-medium uppercase">
                        {poster.status || "PDF"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                        {tr?.title || poster.id}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {tr?.description || ""}
                      </p>
                      {posterUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          asChild
                        >
                          <a href={posterUrl} target="_blank" rel="noreferrer" download>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            {t("download")}
                          </a>
                        </Button>
                      )}
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

export default Posters;
