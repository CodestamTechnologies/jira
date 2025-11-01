'use client';

import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { InvoiceGenerator } from '@/components/invoice-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function InvoicePageClient() {
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
            You do not have permission to access this page. Only administrators can generate invoices.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <InvoiceGenerator />;
}
