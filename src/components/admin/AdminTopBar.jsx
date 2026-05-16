import { Menu, PanelRight } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

export const AdminTopBar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  user, 
  initials 
}) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {sidebarOpen ? <PanelRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <UserDropdown user={user} initials={initials} variant="topbar" />
      </div>
    </header>
  );
};
