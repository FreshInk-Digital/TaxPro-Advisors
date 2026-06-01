// File: src/pages/AdminLogin.jsx
// Real API login with Zod validation + Sonner toasts + Skeleton loading

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Lock, Mail, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi, setToken } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";
import { siteConfig } from "@/lib/siteConfig";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      const res = await authApi.login(values.email, values.password);
      const authData = res?.data?.data || res?.data || {};
      const token = authData.token || authData.accessToken || authData.access_token || res?.token;
      const expiresAt = authData.expiresAt || authData.expires_at || res?.expiresAt || null;

      if (token) {
        setToken(token, expiresAt);

        // Store minimal user info
        if (authData?.user) {
          sessionStorage.setItem("adminUser", JSON.stringify(authData.user));
        }

        toast.success("Welcome back! Redirecting to dashboard…");
        setTimeout(() => navigate("/admin"), 800);
      } else {
        toast.error(res?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      toast.error(err?.message || t("invalidCredentials"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("adminLogin")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("adminLoginDesc")}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-5"
          noValidate
        >
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("username")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder={siteConfig.adminDefaultEmail}
                autoComplete="email"
                {...register("email")}
                className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                className={`pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            id="login-submit-btn"
            type="submit"
            className="w-full gradient-primary text-primary-foreground"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              t("login")
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
