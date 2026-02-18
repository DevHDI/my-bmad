import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  color?: "violet" | "blue" | "emerald" | "amber" | "rose" | "primary";
}

const colorStyles = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  violet: {
    bg: "bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
  },
  blue: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  rose: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  color = "primary",
}: StatsCardProps) {
  const c = colorStyles[color];

  return (
    <Card
      className={cn(
        "glass-card",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-4xl font-bold">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", c.bg)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
