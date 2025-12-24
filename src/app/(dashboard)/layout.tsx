import type { PropsWithChildren } from 'react';
import { Suspense } from 'react';

import { AdminSidebarProvider } from '@/components/admin-sidebar-context';
import { AdminSheet } from '@/components/admin-sidebar';
import { CommandPalette } from '@/components/command-palette';
import { ModalProvider } from '@/components/modal-provider';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <AdminSidebarProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--header-height": "4rem",
          } as React.CSSProperties
        }
      >
        <ModalProvider />
        <CommandPalette />

        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="@container/main flex flex-1 flex-col">
              <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
                <div className="flex flex-col gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6 pt-4 md:pt-6">
                  {children}
                </div>
              </Suspense>
            </div>
          </div>
        </SidebarInset>

        <AdminSheet />
      </SidebarProvider>
    </AdminSidebarProvider>
  );
};
export default DashboardLayout;
