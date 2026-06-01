import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteConfig } from "@/lib/siteConfig";

const languages = [
  { code: "en", label: "EN" },
  { code: "sw", label: "SW" },
  { code: "zh-CN", label: "中文" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { label: t("home"), path: "/" },
    { label: t("services"), path: "/services" },
    { label: t("documentation"), path: "/documentation" },
    { label: t("posters"), path: "/posters" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 shadow-sm backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">{siteConfig.companyName}</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                location.pathname === link.path
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    lang === l.code
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to="/admin/login">{t("adminPortal")}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                location.pathname === link.path
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <div className="flex">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setMobileOpen(false);
                    }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      lang === l.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" asChild className="mt-2">
              <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
                {t("adminPortal")}
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
