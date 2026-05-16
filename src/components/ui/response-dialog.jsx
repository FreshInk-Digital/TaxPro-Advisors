// File: src/components/ui/response-dialog.jsx
// Reusable response dialog: icon → title → subtitle → optional actions
// Rendered via React Portal — always fullscreen, above everything
import * as React from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2, XCircle, AlertTriangle, Info, AlertCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Icon config per variant ──────────────────────────────────────────────────
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10 ring-emerald-500/20",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: XCircle,
    iconBg: "bg-destructive/10 ring-destructive/20",
    iconColor: "text-destructive",
    titleColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10 ring-amber-500/20",
    iconColor: "text-amber-500",
    titleColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    iconBg: "bg-primary/10 ring-primary/20",
    iconColor: "text-primary",
    titleColor: "text-primary",
  },
  confirm: {
    icon: AlertCircle,
    iconBg: "bg-amber-500/10 ring-amber-500/20",
    iconColor: "text-amber-500",
    titleColor: "text-foreground",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * ResponseDialog
 *
 * Props:
 *   open        boolean                  — controls visibility
 *   onClose     () => void               — called when backdrop or X is clicked
 *   variant     "success"|"error"|"warning"|"info"|"confirm"   default "info"
 *   icon        ReactNode                — optional custom icon (overrides variant icon)
 *   title       string                   — main heading (required)
 *   subtitle    string | ReactNode       — supporting text below title
 *   actions     ReactNode                — buttons / actions; if omitted, no footer
 *   closable    boolean                  — show X close button, default true
 *   size        "sm"|"md"|"lg"           — dialog width, default "md"
 */
export const ResponseDialog = ({
  open,
  onClose,
  variant = "info",
  icon: CustomIcon,
  title,
  subtitle,
  actions,
  closable = true,
  size = "md",
}) => {
  if (!open) return null;

  const cfg = VARIANTS[variant] || VARIANTS.info;
  const Icon = cfg.icon;

  const maxW = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[size] ?? "max-w-md";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (closable && e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={cn(
          "relative w-full rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-200",
          maxW
        )}
      >
        {/* Close button */}
        {closable && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Body */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6 text-center gap-4">
          {/* Icon ring */}
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full ring-8 shrink-0",
            cfg.iconBg
          )}>
            {CustomIcon ? (
              <span className={cn("h-10 w-10", cfg.iconColor)}>{CustomIcon}</span>
            ) : (
              <Icon className={cn("h-10 w-10", cfg.iconColor)} strokeWidth={1.5} />
            )}
          </div>

          {/* Title */}
          {title && (
            <h2 className={cn("text-xl font-bold leading-tight", cfg.titleColor)}>
              {title}
            </h2>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions footer */}
        {actions && (
          <div className="flex items-center justify-center gap-3 border-t border-border px-8 py-5">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─── Hook for imperative usage ─────────────────────────────────────────────────
/**
 * useResponseDialog()
 * Returns [dialog, confirm] where:
 *   dialog  — the JSX to include in your render tree
 *   show(options) — opens the dialog; returns Promise<boolean>
 *                   resolves true if primary action clicked, false on cancel/close
 *
 * Usage:
 *   const [dialog, show] = useResponseDialog();
 *   ...
 *   const ok = await show({ variant:"confirm", title:"Delete?", subtitle:"This cannot be undone." });
 *   if (ok) doDelete();
 *   ...
 *   return <>{dialog}</>
 */
export function useResponseDialog() {
  const [state, setState] = React.useState({ open: false });
  const resolverRef = React.useRef(null);

  const show = React.useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, ...options });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(false);
  };

  // Build default actions for "confirm" variant if no custom actions provided
  const defaultConfirmActions = state.variant === "confirm" ? (
    <>
      <Button variant="outline" className="min-w-[100px] rounded-xl" onClick={handleCancel}>
        {state.cancelLabel ?? "Cancel"}
      </Button>
      <Button
        variant={state.confirmVariant ?? "destructive"}
        className="min-w-[100px] rounded-xl"
        onClick={handleConfirm}
      >
        {state.confirmLabel ?? "Confirm"}
      </Button>
    </>
  ) : (
    <Button className="min-w-[120px] rounded-xl" onClick={handleCancel}>
      {state.closeLabel ?? "OK"}
    </Button>
  );

  const dialog = (
    <ResponseDialog
      open={state.open}
      onClose={handleCancel}
      variant={state.variant ?? "info"}
      icon={state.icon}
      title={state.title}
      subtitle={state.subtitle}
      actions={state.actions ?? defaultConfirmActions}
      closable={state.closable ?? true}
      size={state.size ?? "md"}
    />
  );

  return [dialog, show];
}
