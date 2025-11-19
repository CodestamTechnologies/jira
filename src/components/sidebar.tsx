'use client';

import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { DottedSeparator } from './dotted-separator';
import { Logo } from './logo';
import { Navigation } from './navigation';
import { Projects } from './projects';
import { WorkspaceSwitcher } from './workspaces-switcher';

const SidebarContent = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Logo />

          <DottedSeparator className="my-4" />

          <Suspense fallback={null}>
            <WorkspaceSwitcher />
          </Suspense>

          <DottedSeparator className="my-4" />

          <Navigation />

          <DottedSeparator className="my-4" />

         
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Check on mount as well
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      {/* Mobile Sidebar - Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <SheetTrigger asChild>
            <Button
              title="Open Menu"
              size="icon"
              variant="secondary"
              className="size-10 fixed top-4 left-4 z-40"
            >
              <MenuIcon className="size-6 text-muted-foreground" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-[280px]">
            <SheetHeader>
              <VisuallyHidden.Root>
                <SheetTitle>Sidebar Menu</SheetTitle>
              </VisuallyHidden.Root>
              <VisuallyHidden.Root>
                <SheetDescription>Navigate throughout website using Sidebar Menu</SheetDescription>
              </VisuallyHidden.Root>
            </SheetHeader>

            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-[264px] bg-card border-r border-border overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
};
