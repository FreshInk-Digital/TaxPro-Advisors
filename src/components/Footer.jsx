// File: src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">TaxPro</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footerDesc")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">{t("quickLinks")}</h4>
            <nav className="flex flex-col gap-2">
              {[
                { label: t("services"), path: "/services" },
                { label: t("documentation"), path: "/documentation" },
                { label: t("posters"), path: "/posters" },
                { label: t("serviceRequest"), path: "/service-request" },
              ].map((l) => (
                <Link key={l.path} to={l.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">{l.label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">{t("contact")}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@taxpro.com</span>
              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +1 (555) 123-4567</span>
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> 123 Financial District, NY</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">{t("newsletter")}</h4>
            <p className="text-sm text-muted-foreground">{t("newsletterDesc")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-4 text-center">
          <p className="text-xs text-muted-foreground">{t("footerCopy")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
