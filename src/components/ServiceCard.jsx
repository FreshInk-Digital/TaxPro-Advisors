import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ServiceCard = ({ icon: Icon, title, description, features }) => {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-secondary-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <ul className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 text-primary">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Button variant="outline" className="mt-2 w-full" asChild>
        <Link to="/service-request">{t("requestThisService")}</Link>
      </Button>
    </div>
  );
};

export default ServiceCard;
