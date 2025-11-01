'use client';

import { useState } from 'react';
import { FileText, Download, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DottedSeparator } from './dotted-separator';
import InvoicePDF, { InvoiceData } from './invoice-pdf';

interface InvoiceItem {
  id: string;
  description: string;
  price: number;
}

// Hardcoded Company Information
const COMPANY_INFO = {
  name: 'Codestam Technologies',
  address: 'Ranchi, Jharkhand - 835103',
  email: 'codestamtechnologies@gmail.com',
  phone: '+918228840065',
  website: 'https://www.codestam.com',
  logo: 'https://store.codestam.com/codestam_logo.png',
  udyam_registration_number: '214014001053',
};

// Hardcoded Bank Details
const BANK_DETAILS = {
  bankName: 'HDFC Bank',
  accountName: 'Priyanshu Kushwaha',
  accountNumber: '57100718608692',
  ifsc: 'HDFC0005866',
  branch: 'BIT MESRA',
  UPI: 'kushwaha.priyanshu@ptyes',
};

// Terms and Conditions
const TERMS_AND_CONDITIONS = `
1. Payment Terms: Payment is due within 30 days of invoice date.
2. Late Payment: A late fee of 1.5% per month will be applied to overdue accounts.
3. Disputes: Any disputes must be submitted in writing within 15 days of invoice date.
4. Liability: Our liability is limited to the amount paid for the services.
5. Governing Law: This invoice is governed by the laws of the jurisdiction where services were provided.
`;

export const InvoiceGenerator = () => {
  // Invoice Information
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', price: 0 },
  ]);
  const [notes, setNotes] = useState('');

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
  const total = subtotal;

  const getInvoiceData = (): InvoiceData => ({
    companyName: COMPANY_INFO.name,
    companyAddress: COMPANY_INFO.address,
    companyEmail: COMPANY_INFO.email,
    companyPhone: COMPANY_INFO.phone,
    companyWebsite: COMPANY_INFO.website,
    logoUrl: COMPANY_INFO.logo,
    udyamRegistrationNumber: COMPANY_INFO.udyam_registration_number,
    invoiceNumber: invoiceNumber || 'INV-001',
    invoiceDate: format(new Date(), 'MMM dd, yyyy'),
    clientName,
    clientEmail,
    clientAddress,
    items,
    subtotal,
    total,
    notes: notes || undefined,
    termsAndConditions: TERMS_AND_CONDITIONS,
    bankName: BANK_DETAILS.bankName,
    accountName: BANK_DETAILS.accountName,
    accountNumber: BANK_DETAILS.accountNumber,
    ifsc: BANK_DETAILS.ifsc,
    branch: BANK_DETAILS.branch,
    upi: BANK_DETAILS.UPI,
  });

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Invoice Generator
            </CardTitle>
            <CardDescription>Create and download invoices for your clients</CardDescription>
          </div>
          <PDFDownloadLink
            document={<InvoicePDF {...getInvoiceData()} />}
            fileName={`invoice-${invoiceNumber || '001'}.pdf`}
          >
            {({ loading }) => (
              <Button variant="primary" size="sm" disabled={loading}>
                {loading ? (
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
            )}
          </PDFDownloadLink>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              placeholder="INV-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
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

        <DottedSeparator />

        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="John Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="john@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea
                id="clientAddress"
                placeholder="123 Main St, City, State, ZIP"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DottedSeparator />

        {/* Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Services</h3>
            <Button onClick={addItem} variant="outline" size="sm">
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
                <div className="col-span-12 md:col-span-8 space-y-2">
                  <Label className="text-xs">Service Description</Label>
                  <Input
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-10 md:col-span-3 space-y-2">
                  <Label className="text-xs">Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', Number(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 flex items-end">
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

        <DottedSeparator />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
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
