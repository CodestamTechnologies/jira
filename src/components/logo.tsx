import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-x-1.5">
      <Image src="/codestam_logo.webp" alt="Icon" height={24} width={24} />
      <p className={cn('text-sm font-semibold text-foreground')}>Codestam Technologies</p>
    </Link>
  );
};
