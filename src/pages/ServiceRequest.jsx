import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, User, Globe, Shield, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const serviceOptions = [
  { value: "corporate", label: "Corporate Tax Planning", desc: "Business returns, restructuring & R&D credits", icon: Building2 },
  { value: "individual", label: "Individual Wealth & Tax", desc: "High-net-worth individual tax preparation", icon: User },
  { value: "international", label: "International & Expat Tax", desc: "Cross-border taxation and reporting", icon: Globe },
  { value: "estate", label: "Estate & Trust Planning", desc: "Wealth transfer and succession strategies", icon: Shield },
  { value: "audit", label: "IRS Audit & Controversy", desc: "Representation for tax disputes and audits", icon: Clock },
];

const ServiceRequest = () => {
  const [selectedService, setSelectedService] = useState("corporate");
  const { t } = useLanguage();

  return (
    <div className="py-10">
      <div className="container">
        <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> {t("backToServices")}
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground">{t("serviceRequest")}</h1>
        <p className="mt-2 text-muted-foreground">{t("serviceRequestDesc")}</p>

        <div className="mt-10 mx-auto max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("selectedService")}</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="h-14">
                  <SelectValue>
                    {(() => {
                      const selected = serviceOptions.find(o => o.value === selectedService);
                      if (!selected) return null;
                      const SelIcon = selected.icon;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <SelIcon className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{selected.label}</span>
                        </div>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value} className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <OptIcon className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.desc}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("firstName")}</label>
                <Input placeholder="Jane" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("lastName")}</label>
                <Input placeholder="Smith" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("companyName")}</label>
              <Input placeholder="Acme Corp LLC" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("workEmail")}</label>
                <Input type="email" placeholder="jane@acmecorp.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("phoneNumber")} <span className="text-muted-foreground">({t("optional")})</span>
                </label>
                <Input type="tel" placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("projectDetails")}</label>
              <Textarea placeholder={t("projectPlaceholder")} rows={5} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("supportingDocs")} <span className="text-muted-foreground">({t("optional")})</span>
              </label>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-8 px-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">{t("clickUpload")}</p>
                <p className="text-xs text-muted-foreground">{t("fileTypes")}</p>
              </div>
            </div>

            <Button className="w-full" size="lg">{t("submitSecure")}</Button>
            <p className="text-center text-xs text-muted-foreground">{t("encryptedNote")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;
