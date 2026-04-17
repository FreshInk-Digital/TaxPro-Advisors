// File: src/pages/Services.jsx
import { Link } from "react-router-dom";
import { Building2, User, Shield, Globe } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: Building2,
      title: t("corporateTax"),
      description: "Comprehensive tax strategy and compliance for modern enterprises.",
      features: [
        "Corporate & Partnership Tax Returns (1120, 1120S, 1065)",
        "Mergers, Acquisitions, and Restructuring Tax Advisory",
        "R&D Tax Credit Calculation and Filing",
      ],
    },
    {
      icon: User,
      title: "Personal Wealth & Tax",
      description: "Dedicated advisory for high-net-worth individuals and families.",
      features: [
        "Complex Individual Tax Returns (Form 1040)",
        "Trust, Estate, and Gift Tax Planning",
        "Cryptocurrency and Alternative Asset Tax Strategy",
      ],
    },
    {
      icon: Shield,
      title: "Audit Defense",
      description: "Expert representation for IRS and state tax agency audits.",
      features: [
        "Direct IRS Correspondence & Representation",
        "Audit Documentation Preparation and Review",
        "Penalty Abatement and Resolution Negotiations",
      ],
    },
    {
      icon: Globe,
      title: "International & Expat Tax",
      description: "Seamless compliance for global operations and expatriates.",
      features: [
        "Foreign Bank Account (FBAR) & FATCA Reporting",
        "Foreign Earned Income Exclusion Optimization",
        "Transfer Pricing and Cross-Border Structuring",
      ],
    },
  ];

  return (
    <div>
      <section className="py-16 text-center">
        <div className="container">
          <h1 className="text-4xl font-extrabold text-foreground">{t("expertTaxServices")}</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("servicesPageDesc")}</p>
        </div>
      </section>

      <section className="section-alt py-16">
        <div className="container grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{t("newFeature")}</span>
            <h2 className="mt-4 text-2xl font-bold text-foreground">{t("smartDiagnostic")}</h2>
            <p className="mt-3 text-muted-foreground">{t("diagnosticDesc")}</p>
            <Button className="mt-6">{t("runDiagnostic")}</Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>STEP 2 OF 4</span>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="h-1.5 rounded-full bg-muted mb-6">
              <div className="h-1.5 w-1/2 rounded-full bg-primary" />
            </div>
            <p className="font-medium text-foreground mb-4">{t("incomeQuestion")}</p>
            {[t("w2Employment"), t("businessOwner"), t("investmentsCapital")].map((opt, i) => (
              <label key={opt} className={`flex items-center justify-between rounded-lg border p-3 mb-2 cursor-pointer transition-colors ${i === 1 ? "border-primary bg-secondary" : "border-border hover:bg-muted"}`}>
                <span className="text-sm text-foreground">{opt}</span>
                <div className={`h-4 w-4 rounded-full border-2 ${i === 1 ? "border-primary bg-primary" : "border-muted-foreground"}`} />
              </label>
            ))}
            <Button variant="outline" className="mt-4 w-full">{t("continueBtn")}</Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </section>

      <section className="section-alt py-16">
        <div className="container grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t("readyGetStarted")}</h2>
            <p className="mt-3 text-muted-foreground">{t("readyDesc")}</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-primary">📞</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t("directLine")}</p>
                  <p className="text-xs text-muted-foreground">+1 (800) 555-0199</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary">✉️</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t("emailSupport")}</p>
                  <p className="text-xs text-muted-foreground">advisory@taxpro.example.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fullName")}</label>
              <Input placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("emailAddress")}</label>
              <Input type="email" placeholder="jane.smith@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("selectServiceShort")}</label>
              <Select>
                <SelectTrigger><SelectValue placeholder={t("selectServiceShort")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">{t("corporateTax")}</SelectItem>
                  <SelectItem value="personal">Personal Wealth & Tax</SelectItem>
                  <SelectItem value="audit">Audit Defense</SelectItem>
                  <SelectItem value="international">International & Expat Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("additionalInfo")}</label>
              <Textarea placeholder="Please briefly describe your current tax situation..." rows={4} />
            </div>
            <Button className="w-full">{t("submitRequest")}</Button>
            <p className="text-center text-xs text-muted-foreground">{t("secureNote")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
