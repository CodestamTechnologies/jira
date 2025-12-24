'use client';

import Link from 'next/link';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceList } from '@/features/invoices/components/invoice-list';
import { Plus, AlertCircle } from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export function InvoicePageClient() {
  const workspaceId = useWorkspaceId();
  const { data: isAdmin, isLoading } = useAdminStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have permission to access this page. Only administrators can view invoices.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild size={'sm'}>
          <Link href={`/workspaces/${workspaceId}/invoices/create`}>
            <Plus className="mr-2 size-4" />
            Create New Invoice
          </Link>
        </Button>
      </div>

      <InvoiceList />
    </div>
  );
}
