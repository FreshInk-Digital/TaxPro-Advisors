// File: src/pages/Admin.jsx
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, LayoutDashboard, FileEdit, MessageSquare,
  Globe, Users, Image, LogOut, Menu, X, User, Settings, ChevronRight, FileText, FolderOpen, Languages
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi, clearToken, getToken, isTokenExpired } from "@/lib/api";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { UserDropdown } from "@/components/admin/UserDropdown";

// Lazy load tabs for better performance
const DashboardTab = lazy(() => import("./admin/DashboardTab").then(m => ({ default: m.DashboardTab })));
const ServicesTab = lazy(() => import("./admin/ServicesTab").then(m => ({ default: m.ServicesTab })));
const PostersTab = lazy(() => import("./admin/PostersTab").then(m => ({ default: m.PostersTab })));
const RequestsTab = lazy(() => import("./admin/RequestsTab").then(m => ({ default: m.RequestsTab })));
const LanguagesTab = lazy(() => import("./admin/LanguagesTab").then(m => ({ default: m.LanguagesTab })));
const UsersTab = lazy(() => import("./admin/UsersTab").then(m => ({ default: m.UsersTab })));
const AccountTab = lazy(() => import("./admin/AccountTab").then(m => ({ default: m.AccountTab })));
const DocumentTypesTab = lazy(() => import("./admin/DocumentTypesTab").then(m => ({ default: m.DocumentTypesTab })));
const DocumentsTab = lazy(() => import("./admin/DocumentsTab").then(m => ({ default: m.DocumentsTab })));
const ContentTranslationsTab = lazy(() => import("./admin/ContentTranslationsTab").then(m => ({ default: m.ContentTranslationsTab })));

const sidebarItems = [
  { icon: LayoutDashboard, labelKey: "dashboard", id: "dashboard" },
  { icon: Users, labelKey: "usersManagement", id: "users" },
  { icon: MessageSquare, labelKey: "serviceRequests", id: "requests" },
  
  { icon: FileEdit, labelKey: "servicesManagement", id: "services" },
  { icon: Image, labelKey: "contentPosters", id: "posters" },
  { icon: FileText, labelKey: "documentTypes", id: "documentTypes" },
  { icon: FolderOpen, labelKey: "documents", id: "documents" },
  { icon: Globe,          labelKey: "languages",            id: "languages" },
  { icon: Languages,      labelKey: "contentTranslations",  id: "contentTranslations" },
];

const Admin = () => {
  const [activeTab, setActiveTab]   = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // locale passed from LanguagesTab → ContentTranslationsTab after language creation
  const [contentLocale, setContentLocale] = useState(null);

  // Listen for cross-tab navigation events (e.g., from LanguagesTab)
  useEffect(() => {
    const handler = (e) => {
      const { tab, locale } = e.detail || {};
      if (tab) setActiveTab(tab);
      if (locale) setContentLocale(locale);
    };
    window.addEventListener("admin-navigate-tab", handler);
    return () => window.removeEventListener("admin-navigate-tab", handler);
  }, []);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const sessionExpiredHandled = useRef(false);

  useEffect(() => {
    const handleExpiredSession = () => {
      if (sessionExpiredHandled.current) return;
      sessionExpiredHandled.current = true;
      toast.error("Session Expired please Login Again");
      navigate("/admin/login", { replace: true });
    };

    window.addEventListener("admin-session-expired", handleExpiredSession);
    return () => window.removeEventListener("admin-session-expired", handleExpiredSession);
  }, [navigate]);

  useEffect(() => {
    if (isTokenExpired()) {
      clearToken();
      toast.error("Session Expired please Login Again");
      navigate("/admin/login", { replace: true });
      return;
    }

    if (!getToken()) {
      clearToken();
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  // Retrieve stored user info
  const storedUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("adminUser") || "null");
    } catch {
      return null;
    }
  })();

  const userInitials = (
    (storedUser?.firstName?.[0] || "") + (storedUser?.lastName?.[0] || "")
  ).toUpperCase() || "AD";
  
  const displayName =
    `${storedUser?.firstName || ""} ${storedUser?.lastName || ""}`.trim() ||
    "Admin";

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // silently fail
    }
    clearToken();
    toast.success("Logged out successfully.");
    navigate("/admin/login");
  };

  const renderTab = () => {
    try {
      switch (activeTab) {
        case "dashboard":     return <DashboardTab />;
        case "users":         return <UsersTab />;
        case "documentTypes": return <DocumentTypesTab />;
        case "documents":     return <DocumentsTab />;
        case "services":      return <ServicesTab />;
        case "posters":       return <PostersTab />;
        case "requests":      return <RequestsTab />;
        case "languages":     return <LanguagesTab />;
        case "contentTranslations": return <ContentTranslationsTab initialLocale={contentLocale} />;
        case "account":       return <AccountTab />;
        default:           return <DashboardTab />;
      }
    } catch (err) {
      console.error("Tab render error:", err);
      return <div className="p-4 text-destructive font-medium">An error occurred while loading this tab. Please try refreshing.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-20 md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 border-b border-border p-4 h-16 shrink-0 overflow-hidden ${!sidebarOpen && "md:justify-center"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="animate-in fade-in duration-300">
              <span className="font-bold text-foreground text-sm">TaxProConsult</span>
              <p className="text-[10px] text-muted-foreground leading-none">Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
              title={!sidebarOpen ? t(item.labelKey) : ""}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              } ${!sidebarOpen && "md:justify-center md:px-0"}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{t(item.labelKey)}</span>}
            </button>
          ))}
        </nav>

        {/* User Dropdown in Sidebar */}
        <div className="border-t border-border p-4 space-y-3 shrink-0">
          <Button variant="outline" size="sm" className={`w-full ${!sidebarOpen && "md:p-0 md:w-10 md:h-10 md:rounded-full"}`} asChild>
            <Link to="/" target="_blank">
              <Globe className={`${sidebarOpen ? "mr-2" : ""} h-3.5 w-3.5`} /> 
              {sidebarOpen && "View Site"}
            </Link>
          </Button>
          
          <UserDropdown 
            user={storedUser} 
            initials={userInitials} 
            variant={sidebarOpen ? "sidebar" : "collapsed"}
            onNavigate={(tab) => { setActiveTab(tab); if (window.innerWidth < 768) setSidebarOpen(false); }}
          />
        </div>
      </aside>

        {/* Main content */}
        <div className={`flex flex-1 flex-col min-h-screen transition-[padding] duration-300 ease-in-out ${
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        }`}>
          <AdminTopBar 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            user={storedUser} 
            initials={userInitials} 
          />

          <main className="flex-1 overflow-x-hidden bg-muted/30 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <Suspense fallback={<div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>}>
                {renderTab()}
              </Suspense>
            </div>
          </main>
        </div>
    </div>
  );
};

export default Admin;
