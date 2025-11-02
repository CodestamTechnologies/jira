'use client';

import { Settings, UsersIcon, Clock, FileText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GoCheckCircle, GoCheckCircleFill, GoHome, GoHomeFill } from 'react-icons/go';

import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { cn } from '@/lib/utils';

const routes = [
  {
    label: 'Home',
    href: '',
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: 'My Tasks',
    href: '/tasks',
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: Clock,
    activeIcon: Clock,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    activeIcon: Settings,
  },
  {
    label: 'Members',
    href: '/members',
    icon: UsersIcon,
    activeIcon: UsersIcon,
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: FileText,
    activeIcon: FileText,
    adminOnly: true,
  },
  {
    label: 'Send NDA',
    href: '/nda',
    icon: ShieldCheck,
    activeIcon: ShieldCheck,
    adminOnly: true,
  },
];

export const Navigation = () => {
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const { data: isAdmin } = useAdminStatus();

  return (
    <ul className="flex flex-col">
      {routes.map((route) => {
        // Hide admin-only routes if user is not admin
        if (route.adminOnly && !isAdmin) {
          return null;
        }

        const fullHref = `/workspaces/${workspaceId}${route.href}`;
        // For empty href (home), match exactly; for others, match exact or sub-paths
        const isActive = route.href === '' 
          ? pathname === fullHref || pathname === `/workspaces/${workspaceId}`
          : pathname === fullHref || pathname.startsWith(fullHref + '/');
        const Icon = isActive ? route.activeIcon : route.icon;

        return (
          <li key={fullHref}>
            <Link
              href={fullHref}
              className={cn(
                'flex items-center gap-2.5 rounded-md p-2.5 font-sans text-sm transition',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm hover:opacity-100'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('size-4 mr-2', isActive ? 'text-accent-foreground' : 'text-muted-foreground')} />
              {route.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
