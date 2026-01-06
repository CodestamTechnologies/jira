'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import InvoicePDF, { InvoiceData } from './invoice-pdf';
import { useCreateInvoice } from '@/features/invoices/api/use-create-invoice';
import { useGetNextInvoiceNumber } from '@/features/invoices/api/use-get-next-invoice-number';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { client } from '@/lib/hono';
import { COMPANY_INFO, BANK_DETAILS, TERMS_AND_CONDITIONS } from '@/lib/pdf/constants';
import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging';
import { generateSafeFilename } from '@/lib/pdf/utils';
import type { Invoice } from '@/features/invoices/types';

interface InvoiceItem {
  id: string;
  description: string;
  price: number;
}

// Helper function to normalize phone number to 10 digits
const normalizePhoneNumber = (phone: string | undefined | null): string | undefined => {
  if (!phone) return undefined;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // If it's exactly 10 digits, return it
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }

  // If it's longer (e.g., with country code), take the last 10 digits
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }

  // If it's less than 10 digits, return undefined (invalid)
  return undefined;
};

export const InvoiceGenerator = () => {
  const workspaceId = useWorkspaceId();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: nextInvoiceData, refetch: refetchNextInvoiceNumber } = useGetNextInvoiceNumber();
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();
  const { downloadWithLogging } = useDownloadWithLogging();

  // Invoice Information
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', price: 0 },
  ]);
  const [notes, setNotes] = useState('');

  // Auto-generated invoice number
  const invoiceNumber = nextInvoiceData?.invoiceNumber || '';

  // Refetch next invoice number when component mounts or when invoice is created
  useEffect(() => {
    refetchNextInvoiceNumber();
  }, [refetchNextInvoiceNumber]);

  const selectedProject = projectsData?.documents?.find((p) => p.$id === selectedProjectId);

  // Auto-fill client data from project
  const clientName = selectedProject?.name || '';
  const clientEmail = selectedProject?.clientEmail || '';
  const clientAddress = selectedProject?.clientAddress || '';
  const clientPhone = selectedProject?.clientPhone || '';

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxRate = 0; // Tax rate is 0%
  const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100; // Calculate tax (0% = 0)
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | undefined>();

  const isGeneratingOrCreating = isGenerating || isCreatingInvoice;

  const generateAndDownloadPDF = async (
    invoiceData: InvoiceData,
    finalInvoiceNumber: string,
    serverSubtotal: number,
    serverTaxRate: number,
    serverTaxAmount: number,
    serverTotal: number,
    paymentLink?: string,
  ) => {
    // Generate QR code for payment link if available
    let qrCodeDataUrl: string | undefined;
    if (paymentLink) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(paymentLink, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Continue without QR code if generation fails
      }
    }

    const finalInvoiceData = {
      ...invoiceData,
      invoiceNumber: finalInvoiceNumber,
      subtotal: serverSubtotal,
      taxRate: serverTaxRate,
      taxAmount: serverTaxAmount,
      total: serverTotal,
      paymentLinkUrl: paymentLink,
      paymentLinkQrCode: qrCodeDataUrl,
    };

    // Generate and download PDF
    const doc = <InvoicePDF {...finalInvoiceData} />;
    pdf(doc)
      .toBlob()
      .then(async (blob) => {
        const filename = generateSafeFilename(`invoice-${finalInvoiceNumber.replace(/\//g, '-')}`, 'pdf');
        await downloadWithLogging({
          documentType: 'INVOICE',
          blob,
          filename,
          documentName: `invoice-${finalInvoiceNumber}`,
          invoiceNumber: finalInvoiceNumber,
          workspaceId,
        });
        setIsGenerating(false);
        setPaymentLinkUrl(undefined);

        // Refetch next invoice number for next invoice
        refetchNextInvoiceNumber();
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        setIsGenerating(false);
        setPaymentLinkUrl(undefined);
      });
  };

  const getInvoiceData = (): InvoiceData => ({
    companyName: COMPANY_INFO.legalName,
    companyAddress: COMPANY_INFO.address,
    companyEmail: COMPANY_INFO.email,
    companyPhone: COMPANY_INFO.phone,
    companyWebsite: COMPANY_INFO.website,
    logoUrl: COMPANY_INFO.logoUrl,
    udyamRegistrationNumber: COMPANY_INFO.udyamRegistrationNumber,
    invoiceNumber: invoiceNumber || 'CS/0000/00/00/00',
    invoiceDate: format(new Date(), 'MMM dd, yyyy'),
    clientName,
    clientEmail,
    clientAddress,
    clientPhone,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: notes || undefined,
    termsAndConditions: TERMS_AND_CONDITIONS,
    bankName: BANK_DETAILS.bankName,
    accountName: BANK_DETAILS.accountName,
    accountNumber: BANK_DETAILS.accountNumber,
    ifsc: BANK_DETAILS.ifsc,
    branch: BANK_DETAILS.branch,
    upi: BANK_DETAILS.upi || '',
  });

  const handleDownloadPDF = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first.');
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceData = getInvoiceData();

      // Save invoice to database
      const filteredItems = items.filter((item) => item.description.trim() !== '');

      // Calculate totals first (needed for payment link)
      // Match server-side calculation: round each item price first, then sum
      const validItemsForCalculation = filteredItems
        .filter((item) => item.description && item.description.trim() !== '' && typeof item.price === 'number' && item.price >= 0)
        .map((item) => ({
          description: item.description.trim(),
          price: Math.round(item.price * 100) / 100, // Round to 2 decimal places (matches server)
        }));

      const calculatedSubtotal = validItemsForCalculation.reduce((sum, item) => sum + item.price, 0);
      const calculatedTotal = Math.round(calculatedSubtotal * 100) / 100;

      // Create payment link BEFORE creating invoice (if conditions are met)
      let paymentLink: string | undefined;

      if (clientEmail && clientName && calculatedTotal > 0) {
        try {
          // Normalize phone number to 10 digits
          const normalizedPhone = normalizePhoneNumber(clientPhone);

          // Generate a temporary invoice number for the payment link description
          // (We'll use the actual invoice number after creation, but this is just for the description)
          const tempInvoiceNumber = invoiceNumber || 'TEMP';

          // Create payment link using the API client directly
          const paymentResponse = await client.api.payments['create-link']['$post']({
            json: {
              amount: calculatedTotal,
              currency: 'INR',
              description: `Payment for Invoice ${tempInvoiceNumber}`,
              customer: {
                name: clientName,
                email: clientEmail,
                ...(normalizedPhone && { contact: normalizedPhone }),
              },
              notes: {
                project_id: selectedProjectId,
                workspace_id: workspaceId,
              },
              reminderEnable: true,
            },
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            paymentLink = paymentData.data?.shortUrl;
            setPaymentLinkUrl(paymentLink);
          }
        } catch (error) {
          console.error('Error creating payment link:', error);
          // Continue with invoice creation even if payment link fails
        }
      }

      // Create invoice with payment link included
      createInvoice(
        {
          json: {
            // Invoice number is always server-generated (security)
            // subtotal and total are recalculated server-side (security)
            projectId: selectedProjectId,
            workspaceId,
            items: filteredItems.map((item) => ({
              description: item.description.trim(),
              price: item.price,
            })),
            notes: notes?.trim() || undefined,
            paymentLinkUrl: paymentLink, // Include payment link if created
          },
        },
        {
          onSuccess: async (response) => {
            // Type assertion: response.data contains the invoice
            const invoice = response.data as Invoice;

            // Use the invoice number from the response (server-generated)
            const finalInvoiceNumber = invoice.invoiceNumber || invoiceNumber;

            // Update invoice data with the final invoice number and server-calculated totals
            const serverSubtotal = invoice.subtotal || subtotal;
            const serverTaxRate = 0; // Tax rate is 0%
            const serverTaxAmount = 0; // Tax is 0%
            const serverTotal = invoice.total || total;

            // Use payment link from invoice (saved during creation) or the one we created
            const finalPaymentLink = invoice.paymentLinkUrl || paymentLink;

            // Generate and download PDF with payment link
            generateAndDownloadPDF(
              invoiceData,
              finalInvoiceNumber,
              serverSubtotal,
              serverTaxRate,
              serverTaxAmount,
              serverTotal,
              finalPaymentLink,
            );
          },
          onError: () => {
            setIsGenerating(false);
          },
        },
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="size-4 sm:size-5" />
              Invoice Generator
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Create and download invoices for your clients</CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingOrCreating || !selectedProjectId}
            className="w-full sm:w-auto"
          >
            {isGeneratingOrCreating ? (
              <>
                <svg
                  className="animate-spin mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number (Auto-generated)</Label>
            <Input
              id="invoiceNumber"
              placeholder="Loading..."
              value={invoiceNumber}
              disabled
              className="bg-muted font-mono"
              title="Invoice number is automatically generated in format: CS/YYYY/MM/DD/NN"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="text"
              value={format(new Date(), 'MMM dd, yyyy')}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <Separator />

        {/* Project Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Select Project (Client)</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isLoadingProjects}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder={isLoadingProjects ? 'Loading projects...' : 'Select a project'} />
              </SelectTrigger>
              <SelectContent>
                {projectsData?.documents?.map((project) => (
                  <SelectItem key={project.$id} value={project.$id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Information - Auto-filled from project */}
        {selectedProject && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={clientName} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input value={clientEmail || 'Not set'} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Client Phone</Label>
                  <Input value={clientPhone || 'Not set'} disabled className="bg-muted" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Client Address</Label>
                  <Textarea value={clientAddress || 'Not set'} disabled className="bg-muted" rows={2} />
                </div>
              </div>
              {(!clientEmail || !clientAddress || !clientPhone) && (
                <p className="text-sm text-muted-foreground">
                  Note: Some client information is missing. Please update the project settings.
                </p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Services */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">Services</h3>
            <Button onClick={addItem} variant="outline" size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              Add Service
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 items-start p-3 rounded-lg border bg-card"
              >
                <div className="col-span-12 sm:col-span-8 space-y-2">
                  <Label className="text-xs">Service Description</Label>
                  <Input
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-9 sm:col-span-3 space-y-2">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-end justify-end">
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-base sm:text-lg font-semibold">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
