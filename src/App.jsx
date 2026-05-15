// File: src/App.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Services from "./pages/Services";
import ServiceRequest from "./pages/ServiceRequest";
import Documentation from "./pages/Documentation";
import Posters from "./pages/Posters";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import { getToken } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  },
});

const ProtectedAdmin = () => {
  const isAuth =
    sessionStorage.getItem("adminAuth") === "true" && !!getToken();
  return isAuth ? <Admin /> : <Navigate to="/admin/login" replace />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </>
  );
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/services" element={<Services />} />
      <Route path="/service-request" element={<ServiceRequest />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/posters" element={<Posters />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdmin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        {/* Sonner Toast — Top-Right with richColors */}
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
          duration={4000}
          toastOptions={{
            style: { fontFamily: "inherit" },
          }}
        />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
