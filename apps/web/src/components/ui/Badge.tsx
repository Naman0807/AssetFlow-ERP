import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';

interface BadgeProps {
  value: string;
  className?: string;
}

export function Badge({ value, className }: BadgeProps) {
  return (
    <span className={cn('badge', STATUS_COLORS[value] || 'bg-gray-100 text-gray-800', className)}>
      {value}
    </span>
  );
}
