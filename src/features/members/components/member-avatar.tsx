import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export const MemberAvatar = ({ name, className, fallbackClassName }: MemberAvatarProps) => {
  return (
    <Avatar className={cn('size-5 rounded-full border border-muted transition', className)}>
      <AvatarFallback className={cn('flex items-center justify-center bg-muted font-medium text-muted-foreground', fallbackClassName)}>
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
