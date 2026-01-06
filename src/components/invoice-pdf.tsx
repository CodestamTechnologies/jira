import React from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  Font,
  View,
  Image,
} from '@react-pdf/renderer';

// Register fonts - Only Regular and Bold to avoid italic font errors
Font.register({
  family: 'CourierPrime',
  fonts: [
    {
      src: '/fonts/CourierPrime-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/CourierPrime-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 11,
    fontFamily: 'CourierPrime',
    lineHeight: 1.3,
  },
  key: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  value: {
    fontSize: 9,
    lineHeight: 1.4,
  },
});

// Helper function to get safe font family (falls back to Courier if CourierPrime not available)
const getSafeFont = () => {
  try {
    return 'CourierPrime';
  } catch {
    return 'Courier';
  }
};

export interface InvoiceData {
  // Company Information
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  logoUrl?: string;
  udyamRegistrationNumber?: string;

  // Invoice Information
  invoiceNumber: string;
  invoiceDate: string;

  // Client Information
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;

  // Items
  items: Array<{
    id: string;
    description: string;
    price: number;
  }>;

  // Summary
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Notes and Terms
  notes?: string;
  termsAndConditions?: string;

  // Payment Link
  paymentLinkUrl?: string;
  paymentLinkQrCode?: string; // QR code data URL

  // Bank Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc?: string;
  branch?: string;
  upi?: string;
}

const InvoicePDF: React.FC<InvoiceData> = ({
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyWebsite,
  logoUrl,
  udyamRegistrationNumber,
  invoiceNumber,
  invoiceDate,
  clientName,
  clientEmail,
  clientAddress,
  clientPhone,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  termsAndConditions,
  paymentLinkUrl,
  paymentLinkQrCode,
  bankName,
  accountName,
  accountNumber,
  ifsc,
  branch,
  upi,
}) => {
  const filteredItems = items.filter((item) => item.description.trim() !== '');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo and Header */}
        {logoUrl && (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Image src={logoUrl} style={{ width: 60, height: 'auto' }} />
          </View>
        )}

        {/* Header Title */}
        <Text>
          <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            INVOICE{"\n\n"}
          </Text>
          {companyName && (
            <Text style={{ fontSize: 16, fontWeight: '500', textAlign: 'center' }}>
              {companyName.toUpperCase()}{"\n"}
            </Text>
          )}
          {"\n"}
        </Text>

        {/* Company and Invoice Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text><Text style={styles.key}>COMPANY      : </Text><Text style={styles.value}>{companyName}{"\n"}</Text></Text>
            {companyAddress && (
              <Text>
                {companyAddress.split('\n').map((line, idx) => (
                  <Text key={idx}>
                    <Text style={styles.key}>{idx === 0 ? 'ADDRESS      : ' : '              '}</Text>
                    <Text style={styles.value}>{line}{"\n"}</Text>
                  </Text>
                ))}
              </Text>
            )}
            <Text><Text style={styles.key}>EMAIL        : </Text><Text style={styles.value}>{companyEmail || 'N/A'}{"\n"}</Text></Text>
            <Text><Text style={styles.key}>PHONE        : </Text><Text style={styles.value}>{companyPhone || 'N/A'}{"\n"}</Text></Text>
            <Text><Text style={styles.key}>WEBSITE      : </Text><Text style={styles.value}>{companyWebsite || 'N/A'}{"\n"}</Text></Text>
            {udyamRegistrationNumber && <Text><Text style={styles.key}>UDYAM REG.   : </Text><Text style={styles.value}>{udyamRegistrationNumber}{"\n"}</Text></Text>}
          </View>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text>
              <Text style={styles.key}>INVOICE #    : </Text><Text style={styles.value}>{invoiceNumber || 'INV-001'}{"\n"}</Text>
              <Text style={styles.key}>DATE         : </Text><Text style={styles.value}>{invoiceDate}{"\n"}</Text>
            </Text>
          </View>
        </View>

        <Text>----------------------------------------------------------------------------{"\n"}</Text>

        {/* Client Information */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 6 }}>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text>
              <Text style={styles.key}>CLIENT NAME  : </Text><Text style={styles.value}>{clientName || 'N/A'}{"\n"}</Text>
              <Text style={styles.key}>EMAIL        : </Text><Text style={styles.value}>{clientEmail || 'N/A'}{"\n"}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text>
              <Text style={styles.key}>PHONE        : </Text><Text style={styles.value}>{clientPhone || 'N/A'}{"\n"}</Text>
              <Text style={styles.key}>ADDRESS      : </Text><Text style={styles.value}>{clientAddress || 'N/A'}{"\n"}</Text>
            </Text>
          </View>
        </View>

        <Text>----------------------------------------------------------------------------{"\n"}</Text>

        {/* Items */}
        {filteredItems.length > 0 && (
          <>
            <View style={{ marginTop: 6, marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 11 }}>SERVICES:{"\n"}</Text>
              {filteredItems.map((item) => (
                <Text key={item.id}>
                  <Text style={styles.key}>DESCRIPTION : </Text><Text style={styles.value}>{item.description || 'Service'}{"\n"}</Text>
                  <Text style={styles.key}>AMOUNT      : </Text><Text style={styles.value}>Rs.{item.price.toFixed(2)}{"\n"}</Text>
                </Text>
              ))}
            </View>
            <Text>----------------------------------------------------------------------------{"\n"}</Text>
          </>
        )}

        {/* Summary */}
        <View style={{ marginTop: 6, marginBottom: 6 }}>
          <Text>
            <Text style={styles.key}>SUBTOTAL    : </Text>
            <Text style={styles.value}>Rs.{subtotal.toFixed(2)}{"\n"}</Text>
          </Text>
          <Text>
            <Text style={styles.key}>TAX ({taxRate}%)    : </Text>
            <Text style={styles.value}>Rs.{taxAmount.toFixed(2)}{"\n"}</Text>
          </Text>
          <Text>
            <Text style={{ ...styles.key, fontWeight: 'bold' }}>TOTAL       : </Text>
            <Text style={{ ...styles.value, fontWeight: 'bold' }}>Rs.{total.toFixed(2)}{"\n"}</Text>
          </Text>
        </View>

        {notes && (
          <Text>----------------------------------------------------------------------------{"\n"}</Text>
        )}

        {/* Notes */}
        {notes && (
          <View style={{ marginTop: 6, marginBottom: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>NOTES:{"\n"}</Text>
            <Text style={styles.value}>{notes}{"\n"}</Text>
          </View>
        )}

        <Text>----------------------------------------------------------------------------{"\n"}</Text>

        {/* Payment Link */}
        {paymentLinkUrl && (
          <>
            <View style={{ marginTop: 6, marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 11 }}>PAYMENT LINK:{"\n"}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                {paymentLinkQrCode && (
                  <View style={{ marginRight: 8 }}>
                    <Image
                      src={paymentLinkQrCode}
                      style={{ width: 60, height: 60 }}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ ...styles.value, fontSize: 9, marginBottom: 2 }}>
                    Scan QR code or visit:{"\n"}
                  </Text>
                  <Text style={{
                    ...styles.value,
                    fontSize: 8,
                  }}>
                    {paymentLinkUrl}{"\n"}
                  </Text>
                </View>
              </View>
            </View>
            <Text>----------------------------------------------------------------------------{"\n"}</Text>
          </>
        )}

        {/* Bank Details */}
        <View style={{ marginTop: 6, marginBottom: 6 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 11 }}>BANK DETAILS:{"\n\n"}</Text>
          <Text>
            <Text style={styles.key}>BANK NAME    : </Text><Text style={styles.value}>{bankName}{"\n"}</Text>
            <Text style={styles.key}>ACCOUNT NAME : </Text><Text style={styles.value}>{accountName}{"\n"}</Text>
            <Text style={styles.key}>ACCOUNT #    : </Text><Text style={styles.value}>{accountNumber}{"\n"}</Text>
            {ifsc && <><Text style={styles.key}>IFSC CODE    : </Text><Text style={styles.value}>{ifsc}{"\n"}</Text></>}
            {branch && <><Text style={styles.key}>BRANCH       : </Text><Text style={styles.value}>{branch}{"\n"}</Text></>}
            {upi && <><Text style={styles.key}>UPI ID       : </Text><Text style={styles.value}>{upi}{"\n"}</Text></>}
          </Text>
        </View>

        <Text>----------------------------------------------------------------------------{"\n"}</Text>

        <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <Text style={styles.value}>
            Thank you for your business!{"\n"}
            {companyName}
          </Text>
        </View>

        {/* T&C Apply */}
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ ...styles.value, fontSize: 8 }}>
            T&C apply
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
