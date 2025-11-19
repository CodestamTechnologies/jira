import type { PropsWithChildren } from 'react';

import { AdminSidebarProvider } from '@/components/admin-sidebar-context';
import { AdminSheet } from '@/components/admin-sidebar';
import { CommandPalette } from '@/components/command-palette';
import { ModalProvider } from '@/components/modal-provider';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';

const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-background">
        <ModalProvider />
        <CommandPalette />

        <div className="flex size-full">
          <Sidebar />

          <div className="w-full lg:pl-[264px]">
            <div className="mx-auto h-full max-w-screen-xl">
              <Navbar />

              <main className="flex h-full flex-col px-6 py-8">{children}</main>
            </div>
          </div>
        </div>

        <AdminSheet />
      </div>
    </AdminSidebarProvider>
  );
};
export default DashboardLayout;
