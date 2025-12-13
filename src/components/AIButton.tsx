import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AIButton({
  onClick,
  isLoading = false,
  disabled = false,
  children = 'AI Generate',
  variant = 'outline',
  size = 'sm',
  className,
}: AIButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn(
        'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600',
        className
      )}
    >
      <Sparkles className={cn('h-4 w-4', children && 'mr-2', isLoading && 'animate-pulse')} />
      {children}
    </Button>
  );
}
