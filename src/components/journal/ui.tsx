import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-sheet px-4 py-4 shadow-[0_1px_0_rgba(28,36,48,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-sm font-medium text-muted">{children}</span>;
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-forest";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-sheet disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-sheet px-4 text-sm font-semibold text-ink disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
