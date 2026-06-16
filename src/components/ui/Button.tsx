import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  // CTA principal: branco sobre fundo escuro (estilo da referência)
  primary:
    "bg-white text-ink-950 hover:bg-ink-100 focus-visible:ring-white/70",
  secondary:
    "bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 focus-visible:ring-ink-500",
  ghost: "bg-transparent text-ink-300 hover:bg-ink-800 focus-visible:ring-ink-600",
  danger:
    "bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-brand-500",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
        "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
