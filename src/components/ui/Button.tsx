import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-foreground border border-border hover:border-accent disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
  ghost: "bg-transparent text-foreground hover:bg-surface",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
