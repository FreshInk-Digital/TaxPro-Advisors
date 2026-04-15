import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const posters = [
  { title: "2025 Tax Deadlines Poster", desc: "All-date printable poster with all critical filing dates.", category: "Deadlines", format: "PDF" },
  { title: "Deduction Checklist", desc: "Essential deductions you shouldn't miss this year.", category: "Checklist", format: "PDF" },
  { title: "Surviving an Audit", desc: "Step-by-step infographic poster for basic compliance.", category: "Compliance", format: "PDF" },
  { title: "Startup Tax Basics", desc: "Quick reference guide for new business founders.", category: "Startup", format: "PDF" },
  { title: "Quarterly Tax Calendar 2025", desc: "Wall calendar with estimated payment due dates.", category: "Deadlines", format: "PDF" },
  { title: "Home Office Deduction Guide", desc: "Visual guide to qualifying for home office deductions.", category: "Deductions", format: "PNG" },
  { title: "Crypto Tax Reporting Poster", desc: "How to report cryptocurrency gains and losses.", category: "Compliance", format: "PDF" },
  { title: "Employee vs Contractor Infographic", desc: "Visual comparison of W-2 vs 1099 classifications.", category: "Compliance", format: "PDF" },
];

const Posters = () => {
  const { t } = useLanguage();

  return (
    <div className="py-16">
      <div className="container">
        <h1 className="text-4xl font-extrabold text-foreground">{t("postersTitle")}</h1>
        <p className="mt-4 max-w-lg text-muted-foreground">{t("postersPageDesc")}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {posters.map((poster) => (
            <div key={poster.title} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{poster.format}</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{poster.category}</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground">{poster.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{poster.desc}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> {t("download")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Posters;
