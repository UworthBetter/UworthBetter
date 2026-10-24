import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  href?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", href, className, children, type = "button", ...rest }: Props) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", className].filter(Boolean).join(" ");
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
