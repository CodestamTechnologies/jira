'use client'

import { useState } from 'react'
import { FileText, Download, IndianRupee } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

import { generateSafeFilename, downloadPDF } from '@/lib/pdf/utils'
import SalarySlipPDF, { type SalarySlipData } from '@/components/salary-slip-pdf'

export function SalarySlipGeneratorClient() {
  const [isGenerating, setIsGenerating] = useState(false)

  // Employee Information
  const [employeeName, setEmployeeName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeePhone, setEmployeePhone] = useState('')
  const [designation, setDesignation] = useState('')

  // Salary Period
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [payDate, setPayDate] = useState('')

  // Earnings
  const [basicSalary, setBasicSalary] = useState('')
  const [hra, setHra] = useState('')
  const [transportAllowance, setTransportAllowance] = useState('')
  const [medicalAllowance, setMedicalAllowance] = useState('')
  const [specialAllowance, setSpecialAllowance] = useState('')
  const [bonus, setBonus] = useState('')
  const [overtime, setOvertime] = useState('')
  const [otherEarnings, setOtherEarnings] = useState('')

  // Deductions
  const [providentFund, setProvidentFund] = useState('')
  const [esi, setEsi] = useState('')
  const [professionalTax, setProfessionalTax] = useState('')
  const [incomeTax, setIncomeTax] = useState('')
  const [loanDeduction, setLoanDeduction] = useState('')
  const [otherDeductions, setOtherDeductions] = useState('')

  // Bank Details
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')

  // Attendance (Optional)
  const [totalPresentDays, setTotalPresentDays] = useState('')
  const [totalWorkedHours, setTotalWorkedHours] = useState('')

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value) || 0
    return isNaN(parsed) ? 0 : parsed
  }

  const handleGenerate = async () => {
    // Validation
    if (!employeeName.trim()) {
      toast.error('Please enter employee name')
      return
    }

    if (!employeeEmail.trim()) {
      toast.error('Please enter employee email')
      return
    }

    if (!designation.trim()) {
      toast.error('Please enter designation')
      return
    }

    if (!month) {
      toast.error('Please select month')
      return
    }

    if (!year.trim()) {
      toast.error('Please enter year')
      return
    }

    if (!basicSalary.trim() || parseNumber(basicSalary) <= 0) {
      toast.error('Please enter basic salary')
      return
    }

    setIsGenerating(true)
    try {
      // Calculate pay date if not provided
      let finalPayDate = payDate.trim()
      if (!finalPayDate) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const monthIndex = monthNames.indexOf(month)
        if (monthIndex !== -1) {
          const yearNum = parseInt(year)
          const payDateObj = new Date(yearNum, monthIndex, 1)
          finalPayDate = format(payDateObj, 'MMM dd, yyyy')
        } else {
          finalPayDate = format(new Date(), 'MMM dd, yyyy')
        }
      }

      // Parse all numeric values
      const basic = parseNumber(basicSalary)
      const hraVal = parseNumber(hra)
      const transport = parseNumber(transportAllowance)
      const medical = parseNumber(medicalAllowance)
      const special = parseNumber(specialAllowance)
      const bonusVal = parseNumber(bonus)
      const overtimeVal = parseNumber(overtime)
      const otherEarningsVal = parseNumber(otherEarnings)

      const pf = parseNumber(providentFund)
      const esiVal = parseNumber(esi)
      const profTax = parseNumber(professionalTax)
      const incomeTaxVal = parseNumber(incomeTax)
      const loan = parseNumber(loanDeduction)
      const otherDeductionsVal = parseNumber(otherDeductions)

      // Calculate totals
      const grossSalary = basic + hraVal + transport + medical + special + bonusVal + overtimeVal + otherEarningsVal
      const totalDeductions = pf + esiVal + profTax + incomeTaxVal + loan + otherDeductionsVal
      const netSalary = grossSalary - totalDeductions

      const salarySlipData: SalarySlipData = {
        employeeName: employeeName.trim(),
        employeeId: employeeId.trim() || undefined,
        employeeEmail: employeeEmail.trim(),
        employeePhone: employeePhone.trim() || undefined,
        designation: designation.trim(),
        month,
        year,
        payDate: finalPayDate,
        basicSalary: basic,
        hra: hraVal > 0 ? hraVal : undefined,
        transportAllowance: transport > 0 ? transport : undefined,
        medicalAllowance: medical > 0 ? medical : undefined,
        specialAllowance: special > 0 ? special : undefined,
        bonus: bonusVal > 0 ? bonusVal : undefined,
        overtime: overtimeVal > 0 ? overtimeVal : undefined,
        otherEarnings: otherEarningsVal > 0 ? otherEarningsVal : undefined,
        providentFund: pf > 0 ? pf : undefined,
        esi: esiVal > 0 ? esiVal : undefined,
        professionalTax: profTax > 0 ? profTax : undefined,
        incomeTax: incomeTaxVal > 0 ? incomeTaxVal : undefined,
        loanDeduction: loan > 0 ? loan : undefined,
        otherDeductions: otherDeductionsVal > 0 ? otherDeductionsVal : undefined,
        grossSalary,
        totalDeductions,
        netSalary,
        accountNumber: accountNumber.trim() || undefined,
        ifsc: ifsc.trim() || undefined,
        bankName: bankName.trim() || undefined,
        totalWorkedHours: totalWorkedHours.trim() ? parseNumber(totalWorkedHours) : undefined,
        totalPresentDays: totalPresentDays.trim() ? parseInt(totalPresentDays) : undefined,
      }

      // Generate PDF
      const doc = <SalarySlipPDF {...salarySlipData} />
      const pdfBlob = await pdf(doc).toBlob()

      // Download PDF
      const filename = generateSafeFilename(`Salary-Slip-${employeeName.trim()}-${month}-${year}`, 'pdf')
      downloadPDF(pdfBlob, filename)

      toast.success('Salary slip PDF generated and downloaded successfully')
    } catch (error) {
      console.error('Error generating salary slip:', error)
      toast.error('Failed to generate salary slip. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="border">
        <CardHeader className="p-4 sm:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <IndianRupee className="size-4 sm:size-5" />
              Salary Slip Generator
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Generate a professional salary slip PDF. All data is processed locally - no data is stored or sent to any server.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          {/* Employee Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">
                  Employee Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeName"
                  placeholder="John Doe"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="EMP001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeEmail">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeEmail"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeePhone">Phone</Label>
                <Input
                  id="employeePhone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="designation">
                  Designation <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="designation"
                  placeholder="Software Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Salary Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Salary Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">
                  Month <span className="text-destructive">*</span>
                </Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="January">January</SelectItem>
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="June">June</SelectItem>
                    <SelectItem value="July">July</SelectItem>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                    <SelectItem value="November">November</SelectItem>
                    <SelectItem value="December">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="text"
                  placeholder="2025"
                  value={year}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '')
                    setYear(value)
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payDate">Pay Date</Label>
                <Input
                  id="payDate"
                  type="text"
                  placeholder="Jan 01, 2025 (auto-filled if empty)"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Earnings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">
                  Basic Salary <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="basicSalary"
                  type="number"
                  placeholder="50000"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hra">HRA (House Rent Allowance)</Label>
                <Input
                  id="hra"
                  type="number"
                  placeholder="20000"
                  value={hra}
                  onChange={(e) => setHra(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportAllowance">Transport Allowance</Label>
                <Input
                  id="transportAllowance"
                  type="number"
                  placeholder="5000"
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                <Input
                  id="medicalAllowance"
                  type="number"
                  placeholder="5000"
                  value={medicalAllowance}
                  onChange={(e) => setMedicalAllowance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialAllowance">Special Allowance</Label>
                <Input
                  id="specialAllowance"
                  type="number"
                  placeholder="10000"
                  value={specialAllowance}
                  onChange={(e) => setSpecialAllowance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  placeholder="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime</Label>
                <Input
                  id="overtime"
                  type="number"
                  placeholder="0"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherEarnings">Other Earnings</Label>
                <Input
                  id="otherEarnings"
                  type="number"
                  placeholder="0"
                  value={otherEarnings}
                  onChange={(e) => setOtherEarnings(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="providentFund">Provident Fund (PF)</Label>
                <Input
                  id="providentFund"
                  type="number"
                  placeholder="0"
                  value={providentFund}
                  onChange={(e) => setProvidentFund(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esi">ESI (Employee State Insurance)</Label>
                <Input
                  id="esi"
                  type="number"
                  placeholder="0"
                  value={esi}
                  onChange={(e) => setEsi(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalTax">Professional Tax</Label>
                <Input
                  id="professionalTax"
                  type="number"
                  placeholder="0"
                  value={professionalTax}
                  onChange={(e) => setProfessionalTax(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incomeTax">Income Tax</Label>
                <Input
                  id="incomeTax"
                  type="number"
                  placeholder="0"
                  value={incomeTax}
                  onChange={(e) => setIncomeTax(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanDeduction">Loan Deduction</Label>
                <Input
                  id="loanDeduction"
                  type="number"
                  placeholder="0"
                  value={loanDeduction}
                  onChange={(e) => setLoanDeduction(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="otherDeductions">Other Deductions</Label>
                <Input
                  id="otherDeductions"
                  type="number"
                  placeholder="0"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Bank Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  placeholder="SBIN0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Attendance (Optional) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Attendance (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPresentDays">Total Present Days</Label>
                <Input
                  id="totalPresentDays"
                  type="number"
                  placeholder="22"
                  value={totalPresentDays}
                  onChange={(e) => setTotalPresentDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalWorkedHours">Total Worked Hours</Label>
                <Input
                  id="totalWorkedHours"
                  type="number"
                  placeholder="176"
                  value={totalWorkedHours}
                  onChange={(e) => setTotalWorkedHours(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !employeeName.trim() || !employeeEmail.trim() || !designation.trim() || !month || !year.trim() || !basicSalary.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <FileText className="mr-2 size-4 animate-pulse" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Generate Salary Slip PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
