
import { cn } from "@/lib/utils";
import React from "react";

interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function CardContainer({
  className,
  variant = "default",
  padding = "md",
  children,
  ...props
}: CardContainerProps) {
  const variantClasses = {
    default: "bg-card text-card-foreground shadow-card",
    glass: "glass",
  };

  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-lg border animate-in",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
