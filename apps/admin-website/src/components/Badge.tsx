import React from "react";

interface BadgeProps {
  variant: "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  return <span className={`custom-badge badge-${variant}`}>{children}</span>;
}
