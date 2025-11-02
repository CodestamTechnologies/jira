'use client';

import { usePathname } from 'next/navigation';

import { UserButton } from '@/features/auth/components/user-button';

import { MobileSidebar } from './mobile-sidebar';
import { ModeToggle } from './ui/mode-toggle';

const pathnameMap = {
  tasks: {
    title: 'My Tasks',
    description: 'View all of your tasks here.',
  },
  projects: {
    title: 'My Project',
    description: 'View tasks of your project here.',
  },
  invoices: {
    title: 'All Invoices',
    description: 'View and manage all invoices for your workspace',
  },
  // Remove standalone NDA and Joining Letter routes - now integrated in member pages
  members: {
    title: 'Members',
    description: 'View and manage workspace members',
  },
  attendance: {
    title: 'Attendance',
    description: 'Track your daily attendance and view your history',
  },
};

const defaultMap = {
  title: 'Home',
  description: 'Monitor all of your projects and tasks here.',
};

export const Navbar = () => {
  const pathname = usePathname();
  const pathnameParts = pathname.split('/');
  const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap;
  const subRoute = pathnameParts[4]; // For routes like /invoices/create

  // Handle sub-routes for invoices
  if (pathnameKey === 'invoices' && subRoute === 'create') {
    return (
      <nav className="flex items-center justify-between px-6 pt-4">
        <div className="hidden flex-col lg:flex">
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <p className="text-muted-foreground">Generate and download invoices for your clients</p>
        </div>

        <MobileSidebar />

        <div className="flex items-center gap-x-2.5">
          <ModeToggle />
          <UserButton />
        </div>
      </nav>
    );
  }

  // Handle member detail pages
  if (pathnameKey === 'members' && pathnameParts[4]) {
    return (
      <nav className="flex items-center justify-between px-6 pt-4">
        <div className="hidden flex-col lg:flex">
          <h1 className="text-2xl font-semibold">Member Profile</h1>
          <p className="text-muted-foreground">View member details and generate documents</p>
        </div>

        <MobileSidebar />

        <div className="flex items-center gap-x-2.5">
          <ModeToggle />
          <UserButton />
        </div>
      </nav>
    );
  }

  const { title, description } = pathnameMap[pathnameKey] || defaultMap;

  return (
    <nav className="flex items-center justify-between px-6 pt-4">
      <div className="hidden flex-col lg:flex">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <p className="text-muted-foreground">{description}</p>
      </div>

      <MobileSidebar />

      <div className="flex items-center gap-x-2.5">
        <ModeToggle />
        <UserButton />

      </div>
    </nav>
  );
};
