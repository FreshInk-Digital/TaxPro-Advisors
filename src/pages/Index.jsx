// File: src/pages/Index.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, FileText, User, ArrowRight, Clock, Shield, CheckCircle, Star, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage1 from "@/assets/hero-image.jpg";
import heroImage2 from "@/assets/hero-2.jpg";
import heroImage3 from "@/assets/hero-3.jpg";
import heroImage4 from "@/assets/hero-4.jpg";

const heroSlides = [
  { src: heroImage1, alt: "Tax consultants reviewing documents", caption: "Expert Tax Advisory" },
  { src: heroImage2, alt: "Team analyzing financial data", caption: "Data-Driven Strategies" },
  { src: heroImage3, alt: "Signing tax documents", caption: "Precise Documentation" },
  { src: heroImage4, alt: "Boardroom tax strategy session", caption: "Corporate Planning" },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const stats = [
    { icon: Users, value: "2,500+", label: t("clientsServed") },
    { icon: TrendingUp, value: "$50M+", label: t("taxSavedLabel") },
    { icon: Award, value: "15+", label: t("yearsExperience") },
    { icon: Star, value: "4.9/5", label: t("clientRating") },
  ];

  const testimonials = [
    { name: "Sarah Johnson", role: "CEO, TechFlow Inc.", text: "TaxPro saved us over $200K in our first year. Their strategic approach to corporate tax planning is unmatched.", rating: 5 },
    { name: "Michael Chen", role: "Startup Founder", text: "As a first-time founder, navigating taxes was daunting. TaxPro made it simple and saved me money I didn't know I could save.", rating: 5 },
    { name: "Amanda Williams", role: "Real Estate Investor", text: "Their expertise in real estate tax deductions has been invaluable. Highly recommend for any serious investor.", rating: 5 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30 pointer-events-none" />
        <div className="container relative z-10 grid gap-12 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-6 animate-fade-in">
            <span className="inline-flex w-fit items-center gap-2 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md">
              {t("heroTag")}
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
              {t("heroTitle1")}{" "}
              <span className="gradient-text">{t("heroTitle2")}</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground leading-relaxed">{t("heroDesc")}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow" asChild>
                <Link to="/services">{t("getStarted")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/services">{t("viewServices")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-slide-in-right" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              {heroSlides.map((slide, i) => (
                <img key={i} src={slide.src} alt={slide.alt} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: currentSlide === i ? 1 : 0 }} width={800} height={600} />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-foreground drop-shadow-lg">{heroSlides[currentSlide].caption}</span>
                <div className="flex gap-1.5">
                  {heroSlides.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/50"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 left-4 glass-card flex items-center gap-3 rounded-xl px-5 py-3 shadow-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">$50M+</p>
                <p className="text-xs text-muted-foreground">{t("taxSaved")}</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-2 z-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl gradient-primary p-6 shadow-xl">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center text-primary-foreground animate-count-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <stat.icon className="h-6 w-6 mb-1 opacity-80" />
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
          <span className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground mb-4">{t("whatWeDo")}</span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">{t("ourServices")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("servicesSubtitle")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Building2, title: t("corporateTax"), desc: t("corporateTaxDesc") },
              { icon: FileText, title: t("taxDocumentation"), desc: t("taxDocDesc") },
              { icon: User, title: t("individualConsulting"), desc: t("individualDesc") },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-8 text-left hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <Button variant="outline" className="mt-5 w-full" asChild>
                  <Link to="/service-request">{t("requestService")} <ArrowRight className="ml-2 h-3 w-3" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container text-center">
          <span className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground mb-4">{t("testimonials")}</span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">{t("whatClientsSay")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("testimonialsSubtitle")}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <div key={tm.name} className="rounded-2xl border border-border bg-card p-6 text-left hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tm.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{tm.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{tm.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tm.name}</p>
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
            <span className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground w-fit">{t("getInTouch")}</span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">{t("readyOptimize")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("contactDesc")}</p>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover-lift">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t("fastResponse")}</p>
                  <p className="text-xs text-muted-foreground">{t("fastResponseDesc")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover-lift">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t("secureConfidential")}</p>
                  <p className="text-xs text-muted-foreground">{t("secureDesc")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("firstName")}</label>
                <Input placeholder="e.g. Jane" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("lastName")}</label>
                <Input placeholder="e.g. Doe" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("emailAddress")}</label>
              <Input type="email" placeholder="jane@company.com" />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("serviceRequested")}</label>
              <Select>
                <SelectTrigger><SelectValue placeholder={t("selectService")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">{t("corporateTax")}</SelectItem>
                  <SelectItem value="individual">{t("individualConsulting")}</SelectItem>
                  <SelectItem value="international">International & Expat Tax</SelectItem>
                  <SelectItem value="estate">Estate & Trust Planning</SelectItem>
                  <SelectItem value="audit">IRS Audit & Controversy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("yourMessage")}</label>
              <Textarea placeholder="Tell us about your tax situation..." rows={4} />
            </div>
            <Button className="mt-6 w-full gradient-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow" size="lg">
              {t("sendRequest")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Posters Preview */}
      <section className="py-20">
        <div className="container text-center">
          <span className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground mb-4">{t("freeResources")}</span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">{t("postersResources")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("postersDesc")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {["2025 Tax Deadlines Poster", "Deduction Checklist", "Surviving an Audit", "Startup Tax Basics"].map((title, i) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 text-left hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <div className="mb-4 h-36 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary/60" />
                </div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">Quick reference guide for tax professionals.</p>
                <Button variant="outline" size="sm" className="mt-4 w-full text-xs">{t("downloadPdf")}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl gradient-primary p-10 md:p-14 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">{t("ctaDesc")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="shadow-md" asChild>
                <Link to="/service-request">{t("bookConsultation")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/services">{t("exploreServices")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
