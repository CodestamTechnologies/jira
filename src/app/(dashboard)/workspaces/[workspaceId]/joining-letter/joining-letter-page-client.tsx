'use client'

import { useState } from 'react'
import { FileText, Download, Send } from 'lucide-react'
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
import { toast } from 'sonner'

import { COMPANY_INFO } from '@/lib/pdf/constants'
import { pdfBlobToBase64, generateSafeFilename } from '@/lib/pdf/utils'
import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import JoiningLetterPDF, { type JoiningLetterData } from '@/components/joining-letter-pdf'

export function JoiningLetterPageClient() {
  const workspaceId = useWorkspaceId()
  const { data: isAdmin, isLoading } = useAdminStatus()
  const { downloadWithLogging } = useDownloadWithLogging()

  const [employeeName, setEmployeeName] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeeAddress, setEmployeeAddress] = useState('')
  const [position, setPosition] = useState('Web Developer')
  const [date, setDate] = useState<Date>(new Date())
  const [dateOpen, setDateOpen] = useState(false)
  const [minSalary, setMinSalary] = useState('15,000')
  const [maxSalary, setMaxSalary] = useState('25,000')
  const [reportingPerson, setReportingPerson] = useState('Pawan Kumar Mahto (Chief of Staff)')
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDFBase64 = async (data: JoiningLetterData): Promise<string> => {
    const doc = <JoiningLetterPDF {...data} />
    const pdfBlob = await pdf(doc).toBlob()
    return pdfBlobToBase64(pdfBlob)
  }

  const formatDateWithOrdinal = (date: Date): string => {
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    
    const getOrdinal = (n: number): string => {
      if (n > 3 && n < 21) return `${n}th`
      switch (n % 10) {
        case 1: return `${n}st`
        case 2: return `${n}nd`
        case 3: return `${n}rd`
        default: return `${n}th`
      }
    }
    
    return `${getOrdinal(day)} ${month}, ${year}`
  }

  const handleDownload = async () => {
    if (!employeeName || !employeeEmail || !employeeAddress || !position) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    try {
      const formattedDate = formatDateWithOrdinal(date)
      
      const letterData: JoiningLetterData = {
        employeeName,
        employeeEmail,
        employeeAddress,
        position,
        date: formattedDate,
        minSalary,
        maxSalary,
        reportingPerson,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      // Generate PDF on client
      const doc = <JoiningLetterPDF {...letterData} />
      const pdfBlob = await pdf(doc).toBlob()
      
      // Download PDF with logging
      const filename = generateSafeFilename(`Joining-Letter-${employeeName}`, 'pdf')
      await downloadWithLogging({
        documentType: 'JOINING_LETTER',
        blob: pdfBlob,
        filename,
        documentName: `Joining-Letter-${employeeName}`,
        employeeName,
        workspaceId,
      })

      toast.success('Joining Letter PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need admin privileges to generate joining letters.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Probation Period Joining Letter
          </CardTitle>
          <CardDescription>
            Fill in the employee details to generate the joining letter PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">
                  Employee Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Sourav Kumar"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeEmail">
                  Employee Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeEmail"
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="employee@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeAddress">
                Employee Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="employeeAddress"
                value={employeeAddress}
                onChange={(e) => setEmployeeAddress(e.target.value)}
                placeholder="Complete address with postal details"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">
                  Position <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Web Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Letter Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate)
                          setDateOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSalary">Minimum Salary (₹)</Label>
                <Input
                  id="minSalary"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="15,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSalary">Maximum Salary (₹)</Label>
                <Input
                  id="maxSalary"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  placeholder="25,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportingPerson">Reporting Person</Label>
              <Input
                id="reportingPerson"
                value={reportingPerson}
                onChange={(e) => setReportingPerson(e.target.value)}
                placeholder="Pawan Kumar Mahto (Chief of Staff)"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
