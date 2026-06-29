import { cn } from "@/lib/utils";
import type { TaskCategory, TaskStatus } from "@/types";

type Variant = "purple" | "blue" | "green" | "pink" | "yellow" | "orange" | "gray";

const VARIANT_CLASSES: Record<Variant, string> = {
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  pink: "bg-pink-100 text-pink-700",
  yellow: "bg-yellow-100 text-yellow-700",
  orange: "bg-orange-100 text-orange-700",
  gray: "bg-gray-100 text-gray-600",
};

const STATUS_VARIANT: Record<TaskStatus, Variant> = {
  open: "green",
  bidding: "blue",
  assigned: "purple",
  in_progress: "yellow",
  completed: "gray",
  disputed: "pink",
  cancelled: "gray",
};

const CATEGORY_VARIANT: Record<TaskCategory, Variant> = {
  data_analysis: "blue",
  code_generation: "purple",
  research: "orange",
  content_creation: "pink",
  api_integration: "yellow",
  smart_contract: "green",
  other: "gray",
};

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  data_analysis: "Data Analysis",
  code_generation: "Code Generation",
  research: "Research",
  content_creation: "Content",
  api_integration: "API Integration",
  smart_contract: "Smart Contract",
  other: "Other",
};

interface BadgeProps {
  children?: React.ReactNode;
  variant?: Variant;
  status?: TaskStatus;
  category?: TaskCategory;
  className?: string;
}

export function Badge({ children, variant = "gray", status, category, className }: BadgeProps) {
  const v = status ? STATUS_VARIANT[status] : category ? CATEGORY_VARIANT[category] : variant;
  const label = status
    ? status.replace("_", " ")
    : category
    ? CATEGORY_LABEL[category]
    : children;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        VARIANT_CLASSES[v],
        className
      )}
    >
      {label}
    </span>
  );
}
