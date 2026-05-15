// File: src/pages/Admin.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, LayoutDashboard, FileEdit, MessageSquare,
  Globe, Users, Image, LogOut, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi, clearToken } from "@/lib/api";
import { DashboardTab } from "./admin/DashboardTab";
import { ServicesTab } from "./admin/ServicesTab";
import { PostersTab } from "./admin/PostersTab";
import { RequestsTab } from "./admin/RequestsTab";
import { LanguagesTab } from "./admin/LanguagesTab";
import { UsersTab } from "./admin/UsersTab";

const sidebarItems = [
  { icon: LayoutDashboard, labelKey: "dashboard", id: "dashboard" },
  { icon: FileEdit, labelKey: "servicesManagement", id: "services" },
  { icon: Image, labelKey: "contentPosters", id: "posters" },
  { icon: MessageSquare, labelKey: "serviceRequests", id: "requests" },
  { icon: Globe, labelKey: "languages", id: "languages" },
  { icon: Users, labelKey: "usersManagement", id: "users" },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

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
        case "dashboard":  return <DashboardTab />;
        case "services":   return <ServicesTab />;
        case "posters":    return <PostersTab />;
        case "requests":   return <RequestsTab />;
        case "languages":  return <LanguagesTab />;
        case "users":      return <UsersTab />;
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
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-foreground text-sm">TaxProConsult</span>
            <p className="text-[10px] text-muted-foreground leading-none">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-border p-4 space-y-3">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/" target="_blank">
              <Globe className="mr-2 h-3.5 w-3.5" /> View Live Site
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{storedUser?.email || "admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-foreground text-sm">TaxProConsult Admin</span>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
