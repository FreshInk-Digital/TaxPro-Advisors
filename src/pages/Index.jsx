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
} from "lucide-react";
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

const localeMap = {
  en: "en",
  sw: "sw",
  zh: "zh-CN",
  "zh-CN": "zh-CN",
};

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataMessage, setDataMessage] = useState("");

  const { lang } = useLanguage();
  const activeLocale = lang || "en";

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

  const posters = Array.isArray(homeData?.posters) ? homeData.posters : [];

  useEffect(() => {
    if (!heroSlides.length) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (loading) {
    return (
      <div className="container py-24">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Loading home page content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {dataMessage ? (
        <div className="container pt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-relaxed">{dataMessage}</p>
          </div>
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
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
                className="gradient-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
                asChild
              >
                <Link to={homeData?.primaryButtonLink || "/services"}>
                  {homeData?.primaryButtonText || "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
                  style={{ opacity: currentSlide === i ? 1 : 0 }}
                  width={800}
                  height={600}
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
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

            <div className="glass-card absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl px-5 py-3 shadow-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {stats?.[1]?.value || "$50M+"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.[1]?.label || "Tax Saved"}
                </p>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 -mt-2">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 rounded-2xl gradient-primary p-6 shadow-xl md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={`${stat.label}-${i}`}
                className="animate-count-up flex flex-col items-center gap-1 text-center text-primary-foreground"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
              >
                <stat.icon className="mb-1 h-6 w-6 opacity-80" />
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section-alt py-20">
        <div className="container text-center">
          <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
            {homeData?.sectionTag || "What We Do"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.sectionTitle || "Our Services"}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {homeData?.sectionSubtitle ||
              "Practical tax advisory and documentation support tailored for businesses and individuals."}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {defaultServiceCards.map((s, i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-8 text-left hover-lift"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>

                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>

                <Button variant="outline" className="mt-5 w-full" asChild>
                  <Link to="/service-request">
                    Request Service
                    <ArrowRight className="ml-2 h-3 w-3" />
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
          <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
            {homeData?.section2Tag || "Testimonials"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.section2Title || "What Clients Say"}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {homeData?.section2Subtitle ||
              "Trusted by founders, companies, and investors who need accurate tax guidance."}
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <div
                key={`${tm.name}-${i}`}
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-6 text-left hover-lift"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: tm.rating || 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>

                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  "{tm.text}"
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
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
      <section className="section-alt py-20">
        <div className="container grid gap-12 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-6">
            <span className="inline-block w-fit rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
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
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover-lift">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary">
                  <Clock className="h-5 w-5 text-primary-foreground" />
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

              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover-lift">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary">
                  <Shield className="h-5 w-5 text-primary-foreground" />
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

          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  First Name
                </label>
                <Input placeholder="e.g. Jane" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Last Name
                </label>
                <Input placeholder="e.g. Doe" />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input type="email" placeholder="jane@company.com" />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Service Requested
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">Corporate Tax</SelectItem>
                  <SelectItem value="individual">
                    Individual Consulting
                  </SelectItem>
                  <SelectItem value="international">
                    International & Expat Tax
                  </SelectItem>
                  <SelectItem value="estate">
                    Estate & Trust Planning
                  </SelectItem>
                  <SelectItem value="audit">IRS Audit & Controversy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Your Message
              </label>
              <Textarea
                placeholder="Tell us about your tax situation..."
                rows={4}
              />
            </div>

            <Button
              className="mt-6 w-full gradient-primary text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
              size="lg"
            >
              Send Request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Posters Preview */}
      <section className="py-20">
        <div className="container text-center">
          <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
            {homeData?.section4Tag || "Free Resources"}
          </span>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {homeData?.section4Title || "Posters & Resources"}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {homeData?.section4Subtitle ||
              "Helpful downloadable materials and quick guides for tax awareness."}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {posters.map((poster, i) => (
              <div
                key={`${poster.title}-${i}`}
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 text-left hover-lift"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
              >
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-muted">
                  <FileText className="h-10 w-10 text-primary/60" />
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {poster.title}
                </h4>

                <p className="mt-1 text-xs text-muted-foreground">
                  {poster.description}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full text-xs"
                >
                  Download PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl gradient-primary p-10 text-center shadow-xl md:p-14">
            <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
              {homeData?.CTA_title || "Ready to work with tax experts?"}
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              {homeData?.CTA_description ||
                "Book a consultation today and let us help you simplify compliance and planning."}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
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
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
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
