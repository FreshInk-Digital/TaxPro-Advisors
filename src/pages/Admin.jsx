import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, LayoutDashboard, FileEdit, MessageSquare, Settings, Globe,
  Upload, Trash2, Filter, Eye, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", id: "dashboard" },
  { icon: FileEdit, label: "Content & Posters", id: "content" },
  { icon: MessageSquare, label: "Service Requests", id: "requests" },
  { icon: Settings, label: "Settings", id: "settings" },
];

const websiteContent = [
  { page: "Home Page", icon: "🏠", updated: "Today, 10:24 AM", status: "Published", languages: "English, Swahili, 中文" },
  { page: "Services Page", icon: "🏢", updated: "Yesterday, 4:15 PM", status: "Published", languages: "English, Swahili, 中文" },
  { page: "Documentation", icon: "📄", updated: "Oct 12, 2025", status: "Draft", languages: "English Only" },
];

const posterItems = [
  { title: "Corporate Tax Planning Guide 2025", size: "2.4 MB", date: "Uploaded Oct 15", type: "PDF" },
  { title: "SME Tax Compliance Infographic", size: "4.1 MB", date: "Uploaded Oct 10", type: "PNG" },
  { title: "Cross-Border Taxation Whitepaper", size: "1.8 MB", date: "Uploaded Sep 28", type: "PDF" },
];

const serviceRequests = [
  { name: "Jane Smith", email: "jane@acme.com", service: "Corporate Tax Planning", date: "Today, 2:30 PM", status: "New" },
  { name: "Robert Chen", email: "robert@globex.com", service: "International & Expat Tax", date: "Yesterday", status: "In Review" },
  { name: "Maria Garcia", email: "maria@startup.io", service: "Individual Wealth & Tax", date: "Oct 10, 2025", status: "Completed" },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("content");
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">SJ</div>
            <div>
              <p className="text-sm font-medium text-foreground">Sarah Jenkins</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto bg-background">
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "content" && <ContentView />}
        {activeTab === "requests" && <RequestsView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
};

const DashboardView = () => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard Overview</h1>
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: "Total Requests", value: "47", change: "+12 this month" },
        { label: "Published Pages", value: "2", change: "1 draft" },
        { label: "Posters Uploaded", value: "3", change: "2.4 MB avg size" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
        </div>
      ))}
    </div>
  </div>
);

const ContentView = () => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">Content & Poster Management</h1>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/" target="_blank"><Globe className="mr-2 h-4 w-4" /> View Live Site</Link>
        </Button>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Publish All Changes
        </Button>
      </div>
    </div>

    {/* Website Content */}
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-1">Website Content</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage text, translations, and layouts for your main pages.</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Page Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Updated</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Languages</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {websiteContent.map((item) => (
              <tr key={item.page} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                  <span>{item.icon}</span> {item.page}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.updated}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.status === "Published" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.languages}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm">Edit Content</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {/* Posters */}
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Posters & Documents</h2>
          <p className="text-sm text-muted-foreground">Upload, replace, or delete downloadable posters and tax documents.</p>
        </div>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-3.5 w-3.5" /> Filter</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Upload card */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-12 px-4 hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 text-primary mb-3" />
          <p className="font-medium text-foreground">Upload Poster</p>
          <p className="text-xs text-muted-foreground">PDF, PNG, or JPG (Max 10MB)</p>
        </div>
        {posterItems.map((poster) => (
          <div key={poster.title} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-36 bg-muted flex items-center justify-center relative">
              <FileEdit className="h-8 w-8 text-muted-foreground" />
              <span className="absolute top-2 right-2 rounded bg-foreground/80 text-primary-foreground px-2 py-0.5 text-[10px] font-medium">{poster.type}</span>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-sm text-foreground">{poster.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>{poster.size}</span>
                <span>{poster.date}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Replace</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const RequestsView = () => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">Service Requests</h1>
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {serviceRequests.map((req) => (
            <tr key={req.email} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{req.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{req.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{req.service}</td>
              <td className="px-4 py-3 text-muted-foreground">{req.date}</td>
              <td className="px-4 py-3">
                <Badge variant={req.status === "New" ? "default" : req.status === "Completed" ? "secondary" : "outline"}>
                  {req.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SettingsView = () => (
  <div className="max-w-lg">
    <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Company Name</label>
        <Input defaultValue="TaxPro Advisors" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Contact Email</label>
        <Input type="email" defaultValue="advisory@taxpro.example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
        <Input type="tel" defaultValue="+1 (800) 555-0199" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Footer Text</label>
        <Textarea defaultValue="© 2025 TaxPro Advisors. All rights reserved. Strict confidentiality guaranteed." rows={3} />
      </div>
      <Button>Save Settings</Button>
    </div>
  </div>
);

export default Admin;
