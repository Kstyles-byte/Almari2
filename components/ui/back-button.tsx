'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'minimal';
  className?: string;
  onClick?: () => void;
}

export function BackButton({ 
  href, 
  label = 'Back', 
  variant = 'outline',
  className,
  onClick 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 text-zervia-600 hover:text-zervia-700 transition-colors group",
          className
        )}
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span className="font-medium">{label}</span>
      </button>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={cn(
        "gap-2",
        variant === 'outline' && "border-zervia-200 text-zervia-700 hover:bg-zervia-50 hover:text-zervia-800 hover:border-zervia-300",
        variant === 'ghost' && "text-zervia-600 hover:text-zervia-700 hover:bg-zervia-50",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

interface BackButtonHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  backLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function BackButtonHeader({ 
  title, 
  subtitle, 
  href, 
  backLabel = 'Back',
  children,
  className 
}: BackButtonHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <BackButton href={href} label={backLabel} variant="minimal" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zervia-900">{title}</h1>
          {subtitle && (
            <p className="text-zervia-600 mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
