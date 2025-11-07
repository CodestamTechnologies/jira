'use client'

import { useState } from 'react'
import { FileText, Download, Send, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'

import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useSendNDA } from '@/features/nda/api/use-send-nda'
import NDAPDF, { type NDAData } from '@/components/nda-pdf'
import { toast } from 'sonner'

import { COMPANY_INFO } from '@/lib/pdf/constants'
import { pdfBlobToBase64, generateSafeFilename } from '@/lib/pdf/utils'
import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'

export function NDAPageClient() {
  const workspaceId = useWorkspaceId()
  const { data: isAdmin, isLoading } = useAdminStatus()
  const { mutate: sendNDA, isPending } = useSendNDA()
  const { downloadWithLogging } = useDownloadWithLogging()

  const [employeeName, setEmployeeName] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeeAddress, setEmployeeAddress] = useState('')
  const [employeeAadhar, setEmployeeAadhar] = useState('')
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date())
  const [dateOpen, setDateOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDFBase64 = async (ndaData: NDAData): Promise<string> => {
    const doc = <NDAPDF {...ndaData} />
    const pdfBlob = await pdf(doc).toBlob()
    return pdfBlobToBase64(pdfBlob)
  }

  const handleDownload = async () => {
    if (!employeeName || !employeeEmail || !employeeAddress || !employeeAadhar) {
      toast.error('Please fill in all required fields')
      return
    }

    if (employeeAadhar.length !== 12 || !/^\d+$/.test(employeeAadhar)) {
      toast.error('Aadhar number must be exactly 12 digits')
      return
    }

    setIsGenerating(true)
    try {
      const formattedDate = format(effectiveDate, 'MMM dd, yyyy')
      
      const ndaData: NDAData = {
        companyName: COMPANY_INFO.legalName,
        companyAddress: COMPANY_INFO.address,
        companyCIN: COMPANY_INFO.cin,
        employeeName,
        employeeAddress,
        employeeAadhar,
        effectiveDate: formattedDate,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      // Generate PDF on client
      const doc = <NDAPDF {...ndaData} />
      const pdfBlob = await pdf(doc).toBlob()
      
      // Download PDF with logging
      const filename = generateSafeFilename(`NDA-${employeeName}`, 'pdf')
      await downloadWithLogging({
        documentType: 'NDA',
        blob: pdfBlob,
        filename,
        documentName: `NDA-${employeeName}`,
        employeeName,
        workspaceId,
      })

      toast.success('NDA PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeName || !employeeEmail || !employeeAddress || !employeeAadhar) {
      toast.error('Please fill in all required fields')
      return
    }

    if (employeeAadhar.length !== 12 || !/^\d+$/.test(employeeAadhar)) {
      toast.error('Aadhar number must be exactly 12 digits')
      return
    }

    setIsGenerating(true)
    try {
      const formattedDate = format(effectiveDate, 'MMM dd, yyyy')
      
      const ndaData: NDAData = {
        companyName: COMPANY_INFO.legalName,
        companyAddress: COMPANY_INFO.address,
        companyCIN: COMPANY_INFO.cin,
        employeeName,
        employeeAddress,
        employeeAadhar,
        effectiveDate: formattedDate,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      // Generate PDF on client and convert to base64
      const pdfBase64 = await generatePDFBase64(ndaData)

      // Send to server for email
      sendNDA(
        {
          employeeName,
          employeeEmail,
          employeeAddress,
          employeeAadhar,
          effectiveDate: formattedDate,
          pdfBase64,
          workspaceId,
        },
        {
          onSuccess: () => {
            toast.success('NDA sent successfully to employee email')
            // Reset form
            setEmployeeName('')
            setEmployeeEmail('')
            setEmployeeAddress('')
            setEmployeeAadhar('')
            setEffectiveDate(new Date())
          },
          onError: (error: Error) => {
            toast.error(error.message || 'Failed to send NDA. Please try again.')
          },
          onSettled: () => {
            setIsGenerating(false)
          },
        },
      )
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
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
            You do not have permission to access this page. Only administrators can generate NDAs.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border">
      <CardHeader className="p-4 sm:p-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="size-4 sm:size-5" />
            Generate Employee NDA
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Fill in employee details to generate the Non-Disclosure Agreement PDF and send via email or download
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">
                Employee Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeName"
                placeholder="Enter employee full name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeEmail">
                Employee Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeEmail"
                type="email"
                placeholder="employee@example.com"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeAddress">
              Employee Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="employeeAddress"
              placeholder="Enter complete address"
              value={employeeAddress}
              onChange={(e) => setEmployeeAddress(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeAadhar">
                Aadhar Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeAadhar"
                placeholder="123456789012"
                value={employeeAadhar}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                  setEmployeeAadhar(value)
                }}
                maxLength={12}
                required
              />
              <p className="text-xs text-muted-foreground">Must be exactly 12 digits</p>
            </div>
            <div className="space-y-2">
              <Label>
                Effective Date <span className="text-destructive">*</span>
              </Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !effectiveDate && 'text-muted-foreground',
                    )}
                  >
                    {effectiveDate ? format(effectiveDate, 'MMM dd, yyyy') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={effectiveDate} onSelect={(date) => {
                    if (date) {
                      setEffectiveDate(date)
                      setDateOpen(false)
                    }
                  }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={isPending || isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating && !isPending ? (
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
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Download PDF
                </>
              )}
            </Button>
            <Button type="submit" disabled={isPending || isGenerating} className="w-full sm:w-auto">
              {isPending || isGenerating ? (
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
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Send via Email
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
