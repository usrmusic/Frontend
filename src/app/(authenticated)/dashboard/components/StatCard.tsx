import Card from "@/src/components/Card";
import { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  isLoading?: boolean;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
  icon?: ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subText,
  isLoading,
  isHidden,
  onToggleVisibility,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <Card variant="white" className={`col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center ${className}`}>
      <div className="mt-4 flex-1">
        <p className="text-base text-primary">{title}</p>
        <div className="flex items-center gap-2">
          <p className={`text-2xl font-semibold ${isHidden ? "blur-sm" : ""}`}>
            {isLoading ? "..." : value}
          </p>
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {subText && (
          <p className="text-sm text-gray-500 mt-1">{subText}</p>
        )}
      </div>
      {icon && <div className="flex-shrink-0">{icon}</div>}
    </Card>
  );
}
