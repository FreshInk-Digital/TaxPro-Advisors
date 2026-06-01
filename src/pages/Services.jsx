// File: src/pages/Services.jsx
import { Link } from "react-router-dom";
import { Building2, User, Shield, Globe, ArrowRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { servicesApi, publicApi } from "@/lib/api";
import { serviceRequestSchema } from "@/lib/schemas";
import { SkeletonCard } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/siteConfig";

const fallbackIcons = [Building2, User, Shield, Globe];

const Services = () => {
  const { t, lang } = useLanguage();

  // Fetch services
  const { data, isLoading, isError } = useQuery({
    queryKey: ["services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const services = data || [];

  const getTranslation = (service) => {
    const translations = service?.translations || [];
    return (
      (service?.translation?.title ? service.translation : null) ||
      translations.find((tr) => tr?.language?.code === lang) ||
      translations.find((tr) => tr?.language?.code === "en") ||
      translations[0] ||
      null
    );
  };

  // Quick-contact inline form (same as Index contact form)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      serviceRequestSchema.pick({ fullName: true, email: true, phone: true, message: true, serviceId: true, locale: true })
    ),
    defaultValues: {
      serviceId: "",
      fullName: "",
      email: "",
      phone: "",
      message: "",
      locale: lang === "sw" ? "sw" : "en",
    },
  });

  const selectedServiceId = watch("serviceId");

  const onSubmit = async (values) => {
    try {
      const res = await publicApi.submitServiceRequest({
        ...values,
        locale: lang === "sw" ? "sw" : "en",
      });
      if (res?.success) {
        toast.success(t("requestSubmittedToast"));
        reset();
      } else {
        toast.error(res?.message || t("submissionFailed"));
      }
    } catch (err) {
      toast.error(err?.message || t("unableToSubmit"));
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container">
          <h1 className="text-4xl font-extrabold text-foreground">{t("expertTaxServices")}</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("servicesPageDesc")}</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-alt py-16">
        <div className="container">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : services.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { icon: Building2, title: t("corporateTax"), description: "Comprehensive tax strategy for enterprises.", features: ["Tax Returns", "Advisory", "R&D Credits"] },
                { icon: User, title: "Personal Wealth & Tax", description: "Dedicated advisory for high-net-worth individuals.", features: ["Form 1040", "Estate Planning", "Crypto Tax"] },
                { icon: Shield, title: "Audit Defense", description: "Expert IRS and state audit representation.", features: ["IRS Correspondence", "Documentation", "Negotiations"] },
                { icon: Globe, title: "International & Expat Tax", description: "Seamless compliance for global operations.", features: ["FBAR & FATCA", "FEIE", "Transfer Pricing"] },
              ].map((s) => (
                <ServiceCard key={s.title} {...s} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {services.map((service, idx) => {
                const tr = getTranslation(service);
                const Icon = fallbackIcons[idx % fallbackIcons.length];
                return (
                  <ServiceCard
                    key={service.id}
                    icon={Icon}
                    title={tr?.title || `Service ${service.id}`}
                    description={tr?.description || ""}
                    features={tr?.offers || []}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Quick Contact */}
      <section className="section-alt py-16">
        <div className="container grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t("readyGetStarted")}</h2>
            <p className="mt-3 text-muted-foreground">{t("readyDesc")}</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-primary">📞</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t("directLine")}</p>
                  <p className="text-xs text-muted-foreground">{siteConfig.companyPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary">✉️</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t("emailSupport")}</p>
                  <p className="text-xs text-muted-foreground">{siteConfig.companyEmail}</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-xl border border-border bg-card p-6 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="svc-fullname" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("fullName")} <span className="text-destructive">*</span>
              </label>
              <Input id="svc-fullname" placeholder={t("fullNamePlaceholder")} {...register("fullName")}
                className={errors.fullName ? "border-destructive" : ""} />
              {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="svc-email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("emailAddress")} <span className="text-destructive">*</span>
              </label>
              <Input id="svc-email" type="email" placeholder={t("emailPlaceholder")} {...register("email")}
                className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="svc-phone" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("phone")} <span className="text-destructive">*</span>
              </label>
              <Input id="svc-phone" type="tel" placeholder={t("phonePlaceholder")} {...register("phone")}
                className={errors.phone ? "border-destructive" : ""} />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="svc-service" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("selectServiceShort")} <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedServiceId?.toString() || ""}
                onValueChange={(val) => setValue("serviceId", val, { shouldValidate: true })}
              >
                <SelectTrigger id="svc-service" className={errors.serviceId ? "border-destructive" : ""}>
                  <SelectValue placeholder={t("selectServicePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => {
                    const tr = getTranslation(s);
                    return (
                      <SelectItem key={s.id} value={s.id?.toString()}>
                        {tr?.title || `Service ${s.id}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.serviceId && <p className="mt-1 text-xs text-destructive">{errors.serviceId.message}</p>}
            </div>

            <div>
              <label htmlFor="svc-msg" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("additionalInfo")} <span className="text-destructive">*</span>
              </label>
              <Textarea id="svc-msg" placeholder={t("shortMessagePlaceholder")} rows={4}
                {...register("message")} className={errors.message ? "border-destructive" : ""} />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
            </div>

            <Button id="svc-submit-btn" type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("submitting")}</>
              ) : (
                <>{t("submitRequest")} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("secureNote")}</p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Services;
