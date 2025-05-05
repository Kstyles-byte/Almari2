import { cn } from "../../lib/utils";

interface PageHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeading({ title, description, className }: PageHeadingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      )}
    </div>
  );
} 