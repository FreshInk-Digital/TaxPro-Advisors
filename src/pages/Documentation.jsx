import { useState } from "react";
import { Search, FileText, Eye, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = [
  { name: "All Documents", count: 42 },
  { name: "Tax Forms", count: 18 },
  { name: "Corporate Guidelines", count: 9 },
  { name: "Individual Tax", count: 6 },
  { name: "Templates & Checklists", count: 5 },
  { name: "International Trade", count: 4 },
];

const documents = [
  { title: "2024 Corporate Tax Checklist", type: "PDF", size: "1.2 MB", date: "Updated Jan 2024", desc: "A complete checklist of required documents and financial statements needed for corporate tax filings." },
  { title: "Quarterly Estimated Tax Schedule", type: "XLSX", size: "450 KB", date: "Updated Dec 2023", desc: "An interactive spreadsheet to help project and track quarterly estimated tax payments for businesses." },
  { title: "Employee vs. Contractor Guide", type: "PDF", size: "2.4 MB", date: "Updated Feb 2024", desc: "Official guidelines detailing the tax implications and classification rules for W-2 vs 1099 workers." },
  { title: "Form W-9 (Blank Form)", type: "PDF", size: "120 KB", date: "Official Form", desc: "Request for Taxpayer Identification Number and Certification form required for U.S. vendors." },
  { title: "Standard NDA Template", type: "DOCX", size: "35 KB", date: "Template", desc: "A standard mutual Non-Disclosure Agreement template to use before sharing sensitive tax data." },
  { title: "International Tax Compliance", type: "PDF", size: "3.1 MB", date: "Updated Mar 2024", desc: "Comprehensive overview of FBAR, FATCA, and other cross-border reporting requirements." },
];

const Documentation = () => {
  const [activeCategory, setActiveCategory] = useState("All Documents");
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const filtered = documents.filter(
    (d) => d.title.toLowerCase().includes(search.toLowerCase()) || d.desc.toLowerCase().includes(search.toLowerCase())
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

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((doc) => (
              <div key={doc.title} className="rounded-xl border border-border bg-card p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground">{doc.type} · {doc.size} · {doc.date}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex-1">{doc.desc}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> {t("download")}</Button>
                  <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" /> {t("preview")}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
