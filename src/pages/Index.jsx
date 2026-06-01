import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  FileText,
  User,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
import heroImage1 from "@/assets/hero-image.jpg";
import heroImage2 from "@/assets/hero-2.jpg";
import heroImage3 from "@/assets/hero-3.jpg";
import heroImage4 from "@/assets/hero-4.jpg";
import { fetchHomePageData } from "@/lib/homePage";
import { getPosterPreviewUrl, publicApi, servicesApi, postersApi } from "@/lib/api";
import { serviceRequestSchema } from "@/lib/schemas";
import { SkeletonHero, SkeletonStats } from "@/components/ui/skeleton";

const heroImages = [heroImage1, heroImage2, heroImage3, heroImage4];
const statIcons = [Users, TrendingUp, Award, Star];

const defaultServiceCards = [
  {
    icon: Building2,
    title: "Corporate Tax",
    desc: "Strategic tax planning and compliance support for growing businesses.",
  },
  {
    icon: FileText,
    title: "Tax Documentation",
    desc: "Accurate preparation and review of tax records and supporting documentation.",
  },
  {
    icon: User,
    title: "Individual Consulting",
    desc: "Personalized tax guidance for individuals, founders, and professionals.",
  },
];

function getLocaleCandidates(locale) {
  const candidates = [locale];
  if (locale?.includes("-")) candidates.push(locale.split("-")[0]);
  candidates.push("en");
  return [...new Set(candidates.filter(Boolean))];
}

function getTranslationLanguageCode(translation) {
  return translation?.language?.code || translation?.languageCode || translation?.language_code;
}

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataMessage, setDataMessage] = useState("");

  const { lang, t } = useLanguage();
  const activeLocale = lang || "en";

  const { data: apiServicesData } = useQuery({
    queryKey: ["services", activeLocale],
    queryFn: async () => {
      const res = await servicesApi.list(activeLocale);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: apiPostersData } = useQuery({
    queryKey: ["posters", activeLocale],
    queryFn: async () => {
      const res = await postersApi.list(activeLocale);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    let mounted = true;

    async function loadHomePage() {
      setLoading(true);

      const result = await fetchHomePageData(activeLocale);

      if (!mounted) return;

      setHomeData(result?.data || null);
      setDataMessage(result?.message || "");
      setLoading(false);
    }

    loadHomePage();

    return () => {
      mounted = false;
    };
  }, [activeLocale]);

  const heroSlides = useMemo(() => {
    const captions =
      homeData?.slider?.length > 0
        ? homeData.slider
        : [
            { caption: "Expert Tax Advisory" },
            { caption: "Data-Driven Strategies" },
            { caption: "Precise Documentation" },
            { caption: "Corporate Planning" },
          ];

    return heroImages.map((src, index) => ({
      src,
      alt: captions[index]?.caption || `Hero slide ${index + 1}`,
      caption: captions[index]?.caption || `Slide ${index + 1}`,
    }));
  }, [homeData]);

  const stats = useMemo(() => {
    const cmsStats = Array.isArray(homeData?.Stats_Section)
      ? homeData.Stats_Section
      : [];

    if (cmsStats.length > 0) {
      return cmsStats.slice(0, 4).map((item, index) => ({
        icon: statIcons[index] || Users,
        value: item?.value || "—",
        label: item?.label || "—",
      }));
    }

    return [
      { icon: Users, value: "2,500+", label: "Clients Served" },
      { icon: TrendingUp, value: "$50M+", label: "Tax Saved" },
      { icon: Award, value: "15+", label: "Years Experience" },
      { icon: Star, value: "4.9/5", label: "Client Rating" },
    ];
  }, [homeData]);

  const testimonials = Array.isArray(homeData?.testimonials)
    ? homeData.testimonials
    : [];

  const getServiceTranslation = (service) => {
    const translations = service?.translations || [];
    const localeCandidates = getLocaleCandidates(activeLocale);
    return (
      (service?.translation?.title ? service.translation : null) ||
      localeCandidates.map((locale) =>
        translations.find((tr) => getTranslationLanguageCode(tr) === locale)
      ).find(Boolean) ||
      translations[0] ||
      null
    );
  };

  const apiServices = Array.isArray(apiServicesData) ? apiServicesData : [];
  const displayServices = apiServices.length
    ? apiServices.slice(0, 3).map((service, index) => {
        const tr = getServiceTranslation(service);
        const fallback = defaultServiceCards[index % defaultServiceCards.length];
        return {
          icon: fallback.icon,
          title: tr?.title || fallback.title,
          desc: tr?.description || fallback.desc,
        };
      })
    : defaultServiceCards;

  const getPosterImageUrl = (poster) => getPosterPreviewUrl(poster);
  const getPosterTranslation = (poster) => {
    const translations = poster?.translations || [];
    const localeCandidates = getLocaleCandidates(activeLocale);
    return (
      (poster?.translation?.title ? poster.translation : null) ||
      localeCandidates.map((locale) =>
        translations.find((tr) => getTranslationLanguageCode(tr) === locale)
      ).find(Boolean) ||
      translations[0] ||
      null
    );
  };
  const posters = Array.isArray(apiPostersData) && apiPostersData.length
    ? apiPostersData.slice(0, 4).map((poster) => {
        const tr = getPosterTranslation(poster);
        return {
          title: tr?.title || `Poster #${poster.id}`,
          description: tr?.description || "",
          imageUrl: getPosterImageUrl(poster),
          fileUrl: getPosterImageUrl(poster),
        };
      })
    : (Array.isArray(homeData?.posters) ? homeData.posters : []);

  useEffect(() => {
    if (!heroSlides.length) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (loading) {
    return (
      <div>
        <SkeletonHero />
        <div className="container py-4">
          <SkeletonStats count={4} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {dataMessage ? (
        <div className="container pt-6">
          <div className="flex items-start gap-3 px-4 py-3 border rounded-2xl border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-relaxed">{dataMessage}</p>
          </div>
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative py-20 overflow-hidden md:py-28">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-background via-background to-secondary/30" />
        <div className="container relative z-10 grid gap-12 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-6 animate-fade-in">
            <span className="inline-flex w-fit items-center gap-2 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md">
              {homeData?.heroTag}
            </span>

            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
              {homeData?.heroTitleLine1}{" "}
              <span className="gradient-text">{homeData?.heroTitleLine2}</span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              {homeData?.heroDescription}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="transition-shadow shadow-lg gradient-primary text-primary-foreground hover:shadow-xl"
                asChild
              >
                <Link to={homeData?.primaryButtonLink || "/services"}>
                  {homeData?.primaryButtonText || "Get Started"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link to={homeData?.secondaryButtonLink || "/services"}>
                  {homeData?.secondaryButtonText || "View Services"}
                </Link>
              </Button>
            </div>
          </div>

          <div
            className="relative animate-slide-in-right"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              {heroSlides.map((slide, i) => (
                <img
                  key={i}
                  src={slide.src}
                  alt={slide.alt}
                  className="absolute inset-0 object-cover w-full h-full transition-opacity duration-1000"
                  style={{ opacity: currentSlide === i ? 1 : 0 }}
                  width={800}
                  height={600}
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />

              <div className="absolute flex items-center justify-between bottom-4 left-4 right-4">
                <span className="text-sm font-semibold text-primary-foreground drop-shadow-lg">
                  {heroSlides[currentSlide]?.caption}
                </span>

                <div className="flex gap-1.5">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === i
                          ? "w-6 bg-primary-foreground"
                          : "w-2 bg-primary-foreground/50"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute flex items-center gap-3 px-5 py-3 shadow-xl glass-card -bottom-5 left-4 rounded-xl">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {stats?.[1]?.value || "$50M+"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.[1]?.label || "Tax Saved"}
                </p>
              </div>
            </div>

            <div className="absolute w-24 h-24 rounded-full -right-4 -top-4 bg-primary/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 -mt-2">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 p-6 shadow-xl rounded-2xl gradient-primary md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={`${stat.label}-${i}`}
                className="flex flex-col items-center gap-1 text-center animate-count-up text-primary-foreground"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
              >
                <stat.icon className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 section-alt">
        <div className="container text-center">
          <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
            {homeData?.sectionTag || "What We Do"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.sectionTitle || "Our Services"}
          </h2>

          <p className="max-w-lg mx-auto mt-3 text-muted-foreground">
            {homeData?.sectionSubtitle ||
              "Practical tax advisory and documentation support tailored for businesses and individuals."}
          </p>

          <div className="grid gap-6 mt-12 sm:grid-cols-3">
            {displayServices.map((s, i) => (
              <div
                key={i}
                className="p-8 text-left border animate-fade-in-up rounded-2xl border-border bg-card hover-lift"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
              >
                <div className="flex items-center justify-center w-12 h-12 mb-5 shadow-md rounded-xl gradient-primary">
                  <s.icon className="w-6 h-6 text-primary-foreground" />
                </div>

                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>

                <Button variant="outline" className="w-full mt-5" asChild>
                  <Link to="/service-request">
                    {t("requestServices")}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container text-center">
          <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
            {homeData?.section2Tag || "Testimonials"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.section2Title || "What Clients Say"}
          </h2>

          <p className="max-w-lg mx-auto mt-3 text-muted-foreground">
            {homeData?.section2Subtitle ||
              "Trusted by founders, companies, and investors who need accurate tax guidance."}
          </p>

          <div className="grid gap-6 mt-12 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <div
                key={`${tm.name}-${i}`}
                className="p-6 text-left border animate-fade-in-up rounded-2xl border-border bg-card hover-lift"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tm.rating || 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-primary text-primary"
                    />
                  ))}
                </div>

                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  "{tm.text}"
                </p>

                <div className="flex items-center gap-3 mt-5">
                  <div className="flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full gradient-primary text-primary-foreground">
                    {tm.name?.charAt(0) || "C"}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {tm.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{tm.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 section-alt">
        <div className="container grid gap-12 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-6">
            <span className="inline-block px-4 py-1 text-xs font-semibold rounded-full w-fit bg-secondary text-secondary-foreground">
              {homeData?.section3Tag || "Get In Touch"}
            </span>

            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {homeData?.section3Title ||
                "Ready to optimize your tax strategy?"}
            </h2>

            <p className="leading-relaxed text-muted-foreground">
              {homeData?.section3Description ||
                "Send us your request and our team will get back to you with the right guidance."}
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 p-4 border rounded-xl border-border bg-card hover-lift">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 gradient-primary">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {homeData?.fastResponseTitle || "Fast Response"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {homeData?.fastResponseDescription ||
                      "We respond quickly to service and consultation requests."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-xl border-border bg-card hover-lift">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 gradient-primary">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {homeData?.secureTitle || "Secure & Confidential"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {homeData?.secureDescription ||
                      "Your information is handled with care and strict confidentiality."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <IndexContactForm stats={stats} lang={lang} />
        </div>
      </section>

      {/* Posters Preview */}
      <section className="py-20">
        <div className="container text-center">
          <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
            {homeData?.section4Tag || "Free Resources"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.section4Title || "Posters & Resources"}
          </h2>

          <p className="max-w-lg mx-auto mt-3 text-muted-foreground">
            {homeData?.section4Subtitle ||
              "Helpful downloadable materials and quick guides for tax awareness."}
          </p>

          <div className="grid gap-6 mt-12 sm:grid-cols-2 md:grid-cols-4">
            {posters.map((poster, i) => (
              <div
                key={`${poster.title}-${i}`}
                className="p-5 text-left border animate-fade-in-up rounded-2xl border-border bg-card hover-lift"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
              >
                <div className="mb-4 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {poster.imageUrl ? (
                    <img src={poster.imageUrl} alt={poster.title} className="object-contain w-full h-full" />
                  ) : (
                    <FileText className="w-10 h-10 text-primary/60" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {poster.title}
                </h4>

                <p className="mt-1 text-xs text-muted-foreground">
                  {poster.description}
                </p>

                {poster.fileUrl && (
                  <Button variant="outline" size="sm" className="w-full mt-4 text-xs" asChild>
                    <a href={poster.fileUrl} target="_blank" rel="noreferrer" download>
                      Download
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <div className="p-10 text-center shadow-xl rounded-2xl gradient-primary md:p-14">
            <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
              {homeData?.CTA_title || "Ready to work with tax experts?"}
            </h2>

            <p className="max-w-lg mx-auto mt-3 text-primary-foreground/80">
              {homeData?.CTA_description ||
                "Book a consultation today and let us help you simplify compliance and planning."}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="shadow-md"
                asChild
              >
                <Link
                  to={homeData?.CTA_primaryButtonLink || "/service-request"}
                >
                  {homeData?.CTA_primaryButtonText || "Book Consultation"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-blue-600 hover:text-white border-primary-foreground/30 hover:bg-primary-foreground/10"
                asChild
              >
                <Link to={homeData?.CTA_secondaryButtonLink || "/services"}>
                  {homeData?.CTA_secondaryButtonText || "Explore Services"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

// ---------------------------------------------------------------------------
// IndexContactForm — home page inline service request form
// ---------------------------------------------------------------------------
const IndexContactForm = ({ lang }) => {
  const { t } = useLanguage();
  const { data: servicesData } = useQuery({
    queryKey: ["services", lang],
    queryFn: async () => {
      const res = await servicesApi.list(lang);
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const services = servicesData || [];

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
        toast.success(t("requestSubmittedToast"), { duration: 5000 });
        reset();
      } else {
        toast.error(res?.message || t("submissionFailed"));
      }
    } catch (err) {
      toast.error(err?.message || t("unableToSubmit"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-8 space-y-4 border shadow-lg rounded-2xl border-border bg-card"
      noValidate
    >
      {/* Full Name */}
      <div>
        <label htmlFor="idx-fullname" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("fullName")} <span className="text-destructive">*</span>
        </label>
        <Input id="idx-fullname" placeholder={t("fullNamePlaceholder")} {...register("fullName")}
          className={errors.fullName ? "border-destructive" : ""} />
        {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="idx-email" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("emailAddress")} <span className="text-destructive">*</span>
        </label>
        <Input id="idx-email" type="email" placeholder={t("emailPlaceholder")} {...register("email")}
          className={errors.email ? "border-destructive" : ""} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="idx-phone" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("phone")} <span className="text-destructive">*</span>
        </label>
        <Input id="idx-phone" type="tel" placeholder={t("phonePlaceholder")} {...register("phone")}
          className={errors.phone ? "border-destructive" : ""} />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      {/* Service */}
      <div>
        <label htmlFor="idx-service" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("serviceRequested")} <span className="text-destructive">*</span>
        </label>
        <Select
          value={selectedServiceId?.toString() || ""}
          onValueChange={(val) => setValue("serviceId", val, { shouldValidate: true })}
        >
          <SelectTrigger id="idx-service" className={errors.serviceId ? "border-destructive" : ""}>
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

      {/* Message */}
      <div>
        <label htmlFor="idx-message" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("yourMessage")} <span className="text-destructive">*</span>
        </label>
        <Textarea id="idx-message" placeholder={t("homeMessagePlaceholder")} rows={4}
          {...register("message")} className={errors.message ? "border-destructive" : ""} />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <Button
        id="idx-submit-btn"
        type="submit"
        className="w-full transition-shadow shadow-md gradient-primary text-primary-foreground hover:shadow-lg"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("sending")}</>
        ) : (
          <>{t("sendRequest")} <ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </Button>
    </form>
  );
};
