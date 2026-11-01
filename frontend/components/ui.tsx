import { Icon } from "./icon";

export const fieldClass =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-label text-label font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 font-label text-label font-semibold text-primary transition-colors hover:bg-surface-container-high disabled:opacity-50";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-headline-lg font-semibold text-primary">{title}</h1>
        {description && <p className="mt-1 text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-surface-container-lowest p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 flex gap-2 rounded-xl bg-error-container p-3 text-on-error-container">
      <Icon name="error" />
      <span className="text-body-subtle">{message}</span>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-on-surface-variant">
      <Icon name={icon} className="text-[40px]!" />
      <p className="font-semibold text-on-surface">{title}</p>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="font-label text-label text-on-surface-variant">{label}</p>
      <p className="mt-2 text-headline-lg font-bold text-primary">{value}</p>
      {hint && <p className="mt-1 text-body-subtle text-on-surface-variant">{hint}</p>}
    </Card>
  );
}

// Thanh tỷ lệ; màu thể hiện mức độ nhưng luôn có số đi kèm
export function AccuracyBar({ value, label }: { value: number; label: string }) {
  const color = value >= 75 ? "bg-primary" : value >= 50 ? "bg-secondary-container" : "bg-error";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}
