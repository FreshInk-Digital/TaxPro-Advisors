import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const ContentHeader = ({ title, breadcrumbs = [], children }) => {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        
        <nav className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link 
            to="/admin" 
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5" />
              {breadcrumb.path ? (
                <Link 
                  to={breadcrumb.path} 
                  className="hover:text-primary transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {breadcrumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
};
