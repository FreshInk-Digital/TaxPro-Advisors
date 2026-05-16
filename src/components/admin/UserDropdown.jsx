// File: src/components/admin/UserDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { LogOut, User, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi, clearToken } from "@/lib/api";
import { ResponseDialog } from "@/components/ui/response-dialog";
import { Button } from "@/components/ui/button";

export const UserDropdown = ({ user, initials, variant = "sidebar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // silently fail — clear token regardless
    }
    clearToken();
    toast.success("Logged out successfully.");
    navigate("/admin/login");
  };

  const requestLogout = () => {
    setIsOpen(false);
    setConfirmLogout(true);
  };

  if (variant === "sidebar") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center gap-3 rounded-xl p-2 transition-all duration-200 text-left ${
            isOpen ? "bg-muted shadow-sm" : "hover:bg-muted"
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate font-medium">{user?.email || "admin@taxpro.com"}</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-4 left-[calc(100%+12px)] z-50 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in slide-in-from-left-2 duration-200">
            <DropdownContent user={user} onLogout={requestLogout} close={() => setIsOpen(false)} />
          </div>
        )}

        <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={handleLogout} />
      </div>
    );
  }

  if (variant === "collapsed") {
    return (
      <div className="relative flex justify-center" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
            isOpen ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <span className="text-xs font-bold">{initials}</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-4 left-[calc(100%+12px)] z-50 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in slide-in-from-left-2 duration-200">
            <DropdownContent user={user} onLogout={requestLogout} close={() => setIsOpen(false)} />
          </div>
        )}

        <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={handleLogout} />
      </div>
    );
  }

  // Topbar variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full p-1.5 hover:bg-muted transition-colors pr-3"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm font-semibold text-foreground leading-tight">{user?.firstName} {user?.lastName}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{user?.email}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
          <DropdownContent user={user} onLogout={requestLogout} close={() => setIsOpen(false)} />
        </div>
      )}

      <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={handleLogout} />
    </div>
  );
};

// ─── Logout Confirmation Dialog ───────────────────────────────────────────────
const LogoutDialog = ({ open, onClose, onConfirm }) => (
  <ResponseDialog
    open={open}
    onClose={onClose}
    variant="warning"
    title="Sign Out?"
    subtitle="You will be logged out of the admin panel and redirected to the login page."
    actions={
      <>
        <Button variant="outline" className="min-w-[100px] rounded-xl" onClick={onClose}>
          Stay
        </Button>
        <Button
          variant="destructive"
          className="min-w-[100px] rounded-xl"
          onClick={() => { onClose(); onConfirm(); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </>
    }
  />
);

// ─── Dropdown Menu Content ────────────────────────────────────────────────────
const DropdownContent = ({ user, onLogout, close }) => (
  <>
    <div className="px-3 py-2 mb-1 border-b border-border/50">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Settings</p>
    </div>

    <button
      onClick={() => { close(); toast.info("Profile feature coming soon!"); }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <User className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium">My Account</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{user?.email || "admin@taxpro.com"}</span>
      </div>
    </button>

    <button
      onClick={() => { close(); toast.info("Settings coming soon!"); }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Settings className="h-4 w-4" />
      </div>
      <span className="font-medium">Settings</span>
    </button>

    <div className="my-1 border-t border-border/50" />

    <button
      onClick={onLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
        <LogOut className="h-4 w-4" />
      </div>
      <span className="font-medium">Logout</span>
    </button>
  </>
);
