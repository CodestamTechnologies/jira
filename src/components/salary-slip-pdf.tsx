import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'

import { registerPDFFonts } from '@/lib/pdf/fonts'
import { pdfStyles } from '@/lib/pdf/styles'
import {
  Letterhead,
  Separator,
  DocumentTitle,
  Section,
} from '@/lib/pdf/components'
import { COMPANY_INFO as SHARED_COMPANY_INFO, BANK_DETAILS } from '@/lib/pdf/constants'

// Register fonts once
registerPDFFonts()

export interface SalarySlipData {
  employeeName: string
  employeeId?: string
  employeeEmail: string
  employeePhone?: string
  designation: string
  month: string
  year: string
  payDate: string

  // Earnings
  basicSalary: number
  hra?: number
  transportAllowance?: number
  medicalAllowance?: number
  specialAllowance?: number
  bonus?: number
  overtime?: number
  otherEarnings?: number

  // Deductions
  providentFund?: number
  esi?: number
  professionalTax?: number
  incomeTax?: number
  loanDeduction?: number
  otherDeductions?: number

  // Totals
  grossSalary: number
  totalDeductions: number
  netSalary: number

  // Additional Info
  accountNumber?: string
  ifsc?: string
  bankName?: string
  totalWorkedHours?: number
  totalPresentDays?: number
  logoUrl?: string
}

const SalarySlipPDF: React.FC<SalarySlipData> = ({
  employeeName,
  employeeId,
  employeeEmail,
  employeePhone,
  designation,
  month,
  year,
  payDate,
  basicSalary,
  hra = 0,
  transportAllowance = 0,
  medicalAllowance = 0,
  specialAllowance = 0,
  bonus = 0,
  overtime = 0,
  otherEarnings = 0,
  providentFund = 0,
  esi = 0,
  professionalTax = 0,
  incomeTax = 0,
  loanDeduction = 0,
  otherDeductions = 0,
  grossSalary,
  totalDeductions,
  netSalary,
  accountNumber,
  ifsc,
  bankName,
  totalWorkedHours,
  totalPresentDays,
  logoUrl = SHARED_COMPANY_INFO.logoUrl,
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Letterhead - Same as other PDFs */}
        <Letterhead logoUrl={logoUrl} />

        <Separator type="double" />

        {/* Document Title */}
        <DocumentTitle title={`SALARY SLIP - ${month.toUpperCase()} ${year}`} />

        <Separator />

        {/* Employee Information */}
        <View style={{ marginBottom: 12 }}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.key}>Employee Name:</Text>
            <Text style={pdfStyles.value}>{employeeName}</Text>
          </View>
          {employeeId && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.key}>Employee ID:</Text>
              <Text style={pdfStyles.value}>{employeeId}</Text>
            </View>
          )}
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.key}>Email:</Text>
            <Text style={pdfStyles.value}>{employeeEmail}</Text>
          </View>
          {employeePhone && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.key}>Phone:</Text>
              <Text style={pdfStyles.value}>{employeePhone}</Text>
            </View>
          )}
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.key}>Designation:</Text>
            <Text style={pdfStyles.value}>{designation}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.key}>Month:</Text>
            <Text style={pdfStyles.value}>{month} {year}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.key}>Pay Date:</Text>
            <Text style={pdfStyles.value}>{payDate}</Text>
          </View>
          {totalPresentDays !== undefined && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.key}>Present Days:</Text>
              <Text style={pdfStyles.value}>{totalPresentDays}</Text>
            </View>
          )}
          {totalWorkedHours !== undefined && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.key}>Worked Hours:</Text>
              <Text style={pdfStyles.value}>{totalWorkedHours}</Text>
            </View>
          )}
        </View>

        <Separator />

        {/* Earnings & Deductions Side by Side */}
        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 20 }}>
          {/* Earnings Column */}
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.sectionHeading}>EARNINGS</Text>
            <View style={{ marginBottom: 10 }}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.key}>Basic Salary</Text>
                <Text style={pdfStyles.value}>₹{basicSalary.toLocaleString('en-IN')}</Text>
              </View>
              {hra > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>HRA</Text>
                  <Text style={pdfStyles.value}>₹{hra.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {transportAllowance > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Transport</Text>
                  <Text style={pdfStyles.value}>₹{transportAllowance.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {medicalAllowance > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Medical</Text>
                  <Text style={pdfStyles.value}>₹{medicalAllowance.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {specialAllowance > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Special</Text>
                  <Text style={pdfStyles.value}>₹{specialAllowance.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {bonus > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Bonus</Text>
                  <Text style={pdfStyles.value}>₹{bonus.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {overtime > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Overtime</Text>
                  <Text style={pdfStyles.value}>₹{overtime.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {otherEarnings > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Other</Text>
                  <Text style={pdfStyles.value}>₹{otherEarnings.toLocaleString('en-IN')}</Text>
                </View>
              )}
              <View style={[pdfStyles.row, { marginTop: 6, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 6 }]}>
                <Text style={[pdfStyles.key, { fontWeight: 'bold' }]}>Total</Text>
                <Text style={[pdfStyles.value, { fontWeight: 'bold' }]}>₹{grossSalary.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Deductions Column */}
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.sectionHeading}>DEDUCTIONS</Text>
            <View style={{ marginBottom: 10 }}>
              {providentFund > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>PF</Text>
                  <Text style={pdfStyles.value}>₹{providentFund.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {esi > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>ESI</Text>
                  <Text style={pdfStyles.value}>₹{esi.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {professionalTax > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Prof. Tax</Text>
                  <Text style={pdfStyles.value}>₹{professionalTax.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {incomeTax > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Income Tax</Text>
                  <Text style={pdfStyles.value}>₹{incomeTax.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {loanDeduction > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Loan</Text>
                  <Text style={pdfStyles.value}>₹{loanDeduction.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {otherDeductions > 0 && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.key}>Other</Text>
                  <Text style={pdfStyles.value}>₹{otherDeductions.toLocaleString('en-IN')}</Text>
                </View>
              )}
              <View style={[pdfStyles.row, { marginTop: 6, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 6 }]}>
                <Text style={[pdfStyles.key, { fontWeight: 'bold' }]}>Total</Text>
                <Text style={[pdfStyles.value, { fontWeight: 'bold' }]}>₹{totalDeductions.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>

        <Separator />

        {/* Net Salary */}
        <View style={[pdfStyles.row, { marginTop: 12, marginBottom: 12, padding: 10, backgroundColor: '#f0f0f0' }]}>
          <Text style={[pdfStyles.key, { fontWeight: 'bold', fontSize: 12 }]}>NET SALARY</Text>
          <Text style={[pdfStyles.value, { fontWeight: 'bold', fontSize: 12 }]}>₹{netSalary.toLocaleString('en-IN')}</Text>
        </View>

        {/* Bank Details */}
        {(accountNumber || ifsc || bankName) && (
          <>
            <Separator />
            <Section number="" title="BANK DETAILS">
              <View style={{ marginBottom: 12 }}>
                {bankName && (
                  <View style={pdfStyles.row}>
                    <Text style={pdfStyles.key}>Bank Name:</Text>
                    <Text style={pdfStyles.value}>{bankName}</Text>
                  </View>
                )}
                {accountNumber && (
                  <View style={pdfStyles.row}>
                    <Text style={pdfStyles.key}>Account Number:</Text>
                    <Text style={pdfStyles.value}>{accountNumber}</Text>
                  </View>
                )}
                {ifsc && (
                  <View style={pdfStyles.row}>
                    <Text style={pdfStyles.key}>IFSC Code:</Text>
                    <Text style={pdfStyles.value}>{ifsc}</Text>
                  </View>
                )}
              </View>
            </Section>
          </>
        )}

        {/* Footer */}
        <View style={{ marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#000' }}>
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9 }]}>
            This is a system-generated document. No signature required.
          </Text>
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9, marginTop: 6 }]}>
            {SHARED_COMPANY_INFO.name} - {SHARED_COMPANY_INFO.address}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default SalarySlipPDF
