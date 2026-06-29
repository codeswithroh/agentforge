import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className, hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border",
        PADDING[padding],
        hover && "transition-shadow hover:shadow-md cursor-pointer",
        className
      )}
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}
