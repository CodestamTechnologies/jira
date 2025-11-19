import type { LucideIcon } from 'lucide-react';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  value: number;
  variant?: 'up' | 'down' | 'neutral';
  increaseValue?: number;
  icon?: LucideIcon;
  onClick?: () => void;
}

export const AnalyticsCard = ({ title, value, variant, increaseValue, icon: Icon, onClick }: AnalyticsCardProps) => {
  const iconColor = variant === 'up' ? 'text-emerald-500' : variant === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const increaseValueColor = variant === 'up' ? 'text-emerald-500' : variant === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const CaretIcon = variant === 'up' ? FaCaretUp : variant === 'down' ? FaCaretDown : null;

  return (
    <Card
      className={cn('w-full border-none shadow-none', onClick && 'cursor-pointer hover:bg-accent/50 transition-colors')}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-x-2.5">
          <CardDescription className="flex items-center gap-x-2 overflow-hidden font-medium">
            {Icon && <Icon className={cn('size-4', iconColor)} />}
            <span className="truncate text-base">{title}</span>
          </CardDescription>

          {increaseValue !== undefined && CaretIcon && (
            <div className="flex items-center gap-x-1">
              <CaretIcon className={cn(iconColor, 'size-4')} />
              <span className={cn(increaseValueColor, 'truncate text-base font-medium')}>{increaseValue}</span>
            </div>
          )}
        </div>

        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
};
