import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'

import { registerPDFFonts } from '@/lib/pdf/fonts'
import { pdfStyles } from '@/lib/pdf/styles'
import {
  Letterhead,
  Section,
  Separator,
  BulletList,
  SignatureBox,
  DocumentTitle,
} from '@/lib/pdf/components'
import { COMPANY_INFO as SHARED_COMPANY_INFO } from '@/lib/pdf/constants'

// Register fonts once
registerPDFFonts()

export interface JoiningLetterData {
  employeeName: string
  employeeEmail: string
  employeeAddress: string
  position: string
  date: string
  minSalary?: string
  maxSalary?: string
  reportingPerson?: string
  reportingAddress?: string
  ctoName?: string
  ctoPhone?: string
  ctoEmail?: string
  logoUrl?: string
}

const JoiningLetterPDF: React.FC<JoiningLetterData> = ({
  employeeName,
  employeeEmail,
  employeeAddress,
  position,
  date,
  minSalary = '15,000',
  maxSalary = '25,000',
  reportingPerson = 'Pawan Kumar Mahto (Chief of Staff)',
  reportingAddress = SHARED_COMPANY_INFO.address,
  ctoName = 'Sourav Mishra (CTO)',
  ctoPhone = '+91 7051051672',
  ctoEmail = 'souravmishra@codestam.com',
  logoUrl = SHARED_COMPANY_INFO.logoUrl,
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Letterhead */}
        <Letterhead logoUrl={logoUrl} />

        <Separator type="double" />

        {/* Document Title */}
        <DocumentTitle title="PROBATION PERIOD JOINING LETTER" />

        {/* Date */}
        <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
          <Text style={pdfStyles.bodyText}>
            <Text style={pdfStyles.bold}>Date:</Text> {date}
          </Text>
        </View>

        {/* Recipient Information */}
        <Text style={pdfStyles.partyLabel}>To,</Text>
        <Text style={pdfStyles.partyText}>{employeeName}</Text>
        <Text style={pdfStyles.partyText}>{employeeEmail}</Text>
        <Text style={pdfStyles.partyText}>Address - {employeeAddress}</Text>

        <Separator />

        {/* Subject */}
        <Text style={pdfStyles.sectionHeading}>Subject: Joining Letter (Probationary Period)</Text>

        {/* Greeting */}
        <Text style={pdfStyles.bodyText}>
          Dear {employeeName.split(' ')[0]},
        </Text>

        <Text style={pdfStyles.bodyText}>
          We are pleased to offer you the position of <Text style={pdfStyles.bold}>{position}</Text> at Codestam Technologies. You will be on a 3-month probationary period, during which your performance, conduct, and project completion will be reviewed for confirmation as a regular employee.
        </Text>

        {/* Remuneration Section */}
        <Section number="" title="Remuneration:">
          <Text style={pdfStyles.bodyText}>
            You will be eligible for a monthly gross pay in the range of <Text style={pdfStyles.bold}>₹{minSalary} to ₹{maxSalary}</Text>, which will be released after the successful completion of your 3-month probation period, based on your performance and project delivery.
          </Text>
        </Section>

        {/* Probation Conditions */}
        <Section number="" title="Probation Conditions:">
          <BulletList
            items={[
              "You must work full-time for Codestam and not engage in any other employment, freelance, or internship during the probation.",
              "You must complete the full probation period. In case you wish to resign, a minimum 15-day written notice must be given and approved by the company.",
              "During probation, the company reserves the right to terminate employment without notice or compensation if performance, behaviour, or compliance is found unsatisfactory.",
            ]}
          />
        </Section>

        {/* Confirmation Section */}
        <Section number="" title="Confirmation:">
          <Text style={pdfStyles.bodyText}>
            On satisfactory performance and adherence to company policies, you may be confirmed as a regular employee in writing.
          </Text>
        </Section>

        {/* Other Terms */}
        <Section number="" title="Other Terms:">
          <Text style={pdfStyles.bodyText}>
            Your employment will follow all company rules, policies, and confidentiality terms, which may be updated from time to time.
          </Text>
        </Section>

        {/* Reporting Details */}
        <Text style={pdfStyles.bodyText}>
          Please report to <Text style={pdfStyles.bold}>{reportingPerson}</Text> at {reportingAddress}, for onboarding and documentation.
        </Text>

        <Text style={pdfStyles.bodyText}>
          We welcome you to Codestam Technologies and look forward to your valuable contributions.
        </Text>

        {/* Spacer */}
        <View style={pdfStyles.spacerLarge} />

        {/* Closing */}
        <Text style={pdfStyles.bodyText}>Yours sincerely,</Text>

        <View style={pdfStyles.spacerLarge} />

        {/* CTO Signature */}
        <View>
          <Text style={pdfStyles.signatureLabel}>{ctoName}</Text>
          <Text style={pdfStyles.bodyText}>Codestam Technologies</Text>
          <Text style={pdfStyles.bodyText}>
            {ctoPhone} | {ctoEmail}
          </Text>
        </View>

        <Separator type="double" />

        {/* Acknowledgement Section */}
        <Text style={pdfStyles.sectionHeading}>Acknowledgement & Acceptance</Text>

        <Text style={pdfStyles.bodyText}>
          I, <Text style={pdfStyles.bold}>{employeeName}</Text> accept the terms of appointment as stated above.
        </Text>

        <View style={pdfStyles.spacerLarge} />

        {/* Employee Signature */}
        <View style={{ marginTop: 24 }}>
          <Text style={pdfStyles.signatureField}>
            Signature: _________________________
          </Text>
          <Text style={pdfStyles.signatureField}>
            Date: _________________________
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default JoiningLetterPDF
