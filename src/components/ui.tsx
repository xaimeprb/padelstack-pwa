import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

/**
 * Boton base de la PWA con variantes visuales coherentes con el sistema Sportive Material.
 */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`button button--${variant} ${className}`.trim()} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state">
      <Info size={28} />
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function Spinner({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="spinner-row" role="status" aria-live="polite">
      <Loader2 size={20} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="page-loader">
      <Loader2 size={34} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "error" | "success"; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div className={`notice notice--${tone}`}>
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: string; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function statusTone(status?: string) {
  if (!status) return "neutral";
  if (["ACTIVE", "AVAILABLE", "RESOLVED"].includes(status)) return "success";
  if (["OPEN", "IN_PROGRESS", "BLOCKED"].includes(status)) return "warning";
  if (["CANCELLED", "REJECTED", "RESERVED_BY_OTHER"].includes(status)) return "danger";
  if (["RESERVED_BY_ME"].includes(status)) return "info";
  return "neutral";
}

export function ResourceIconShell({ children, tone = "primary" }: { children: ReactNode; tone?: string }) {
  return <span className={`icon-shell icon-shell--${tone}`}>{children}</span>;
}
