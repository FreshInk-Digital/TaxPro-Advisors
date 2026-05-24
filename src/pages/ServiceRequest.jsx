// File: src/pages/ServiceRequest.jsx
// Public service request form — connected to POST /service-requests
// Zod validation + react-hook-form + Sonner toasts + Skeleton loading

import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Building2, User, Globe, Shield, Clock, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
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
import { publicApi, servicesApi } from "@/lib/api";
import { serviceRequestSchema } from "@/lib/schemas";
import { SkeletonForm } from "@/components/ui/skeleton";
import { useState } from "react";

const fallbackIcons = [Building2, User, Globe, Shield, Clock];

const ServiceRequest = () => {
  const { t, lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  // Fetch real services from the API
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const services = servicesData || [];

  // Helper — get translation for current lang from service object
  const getServiceTranslation = (service) => {
    const translations = service?.translations || [];
    const getCode = (translation) => translation?.language?.code || translation?.languageCode || translation?.language_code;
    return (
      (service?.translation?.title ? service.translation : null) ||
      translations.find((tr) => getCode(tr) === lang) ||
      translations.find((tr) => getCode(tr) === "en") ||
      translations[0] ||
      null
    );
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceRequestSchema),
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
        toast.success(
          t("requestSubmittedToast"),
          { duration: 6000 }
        );
        setSubmitted(true);
        reset();
      } else {
        toast.error(res?.message || t("submissionFailed"));
      }
    } catch (err) {
      toast.error(
        err?.message || t("unableToSubmit")
      );
    }
  };

  if (submitted) {
    return (
      <div className="py-10">
        <div className="container">
          <div className="mx-auto max-w-lg text-center py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {t("requestSubmittedTitle")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("requestSubmittedDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setSubmitted(false)} variant="outline">
                {t("submitAnotherRequest")}
              </Button>
              <Button asChild>
                <Link to="/">
                  {t("backToHome")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container">
        <Link
          to="/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToServices")}
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground">
          {t("serviceRequest")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("serviceRequestDesc")}</p>

        <div className="mt-10 mx-auto max-w-2xl">
          {servicesLoading ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <SkeletonForm fields={5} />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-xl border border-border bg-card p-6 space-y-5"
              noValidate
            >
              {/* Service Selection */}
              <div>
                <label
                  htmlFor="req-service"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t("selectedService")} <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedServiceId?.toString() || ""}
                  onValueChange={(val) =>
                    setValue("serviceId", val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    id="req-service"
                    className={`h-12 ${errors.serviceId ? "border-destructive" : ""}`}
                  >
                    <SelectValue placeholder={t("selectedService")}>
                      {services.length > 0 && selectedServiceId
                        ? (() => {
                            const s = services.find(
                              (sv) => sv.id?.toString() === selectedServiceId?.toString()
                            );
                            const tr = s ? getServiceTranslation(s) : null;
                            const Icon =
                              fallbackIcons[services.indexOf(s) % fallbackIcons.length] ||
                              Building2;
                            return tr ? (
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                  <Icon className="h-4 w-4 text-secondary-foreground" />
                                </div>
                                <span className="font-medium text-foreground">
                                  {tr.title}
                                </span>
                              </div>
                            ) : null;
                          })()
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {services.length === 0 ? (
                      <SelectItem value="0" disabled>
                        {t("noServicesAvailable")}
                      </SelectItem>
                    ) : (
                      services.map((service, idx) => {
                        const tr = getServiceTranslation(service);
                        const Icon =
                          fallbackIcons[idx % fallbackIcons.length] || Building2;
                        return (
                          <SelectItem
                            key={service.id}
                            value={service.id?.toString()}
                            className="py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <Icon className="h-4 w-4 text-secondary-foreground" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {tr?.title || service.id}
                                </span>
                                {tr?.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {tr.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {errors.serviceId && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.serviceId.message}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="req-fullname"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t("fullName")} <span className="text-destructive">*</span>
                </label>
                <Input
                  id="req-fullname"
                  placeholder={t("fullNamePlaceholder")}
                  {...register("fullName")}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email + Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="req-email"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    {t("workEmail")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="req-email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    autoComplete="email"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="req-phone"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    {t("phone")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="req-phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="req-message"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t("projectDetails")} <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="req-message"
                  placeholder={t("projectPlaceholder")}
                  rows={5}
                  {...register("message")}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                id="req-submit-btn"
                type="submit"
                className="w-full gradient-primary text-primary-foreground"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    {t("submitSecure")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("encryptedNote")}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;
