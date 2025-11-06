'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Download, ShieldCheck, User, Calendar, Mail as MailIcon, MapPin, Briefcase, Hash, IndianRupee, UserX, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGetMemberDetail } from '@/features/members/api/use-get-member-detail'
import { useUpdateMemberInfo } from '@/features/members/api/use-update-member-info'
import { useUpdateMemberStatus } from '@/features/members/api/use-update-member-status'
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status'
import { MemberAvatar } from '@/features/members/components/member-avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { COMPANY_INFO, BANK_DETAILS } from '@/lib/pdf/constants'
import { pdfBlobToBase64, downloadPDF, generateSafeFilename } from '@/lib/pdf/utils'
import NDAPDF, { type NDAData } from '@/components/nda-pdf'
import JoiningLetterPDF, { type JoiningLetterData } from '@/components/joining-letter-pdf'
import SalarySlipPDF, { type SalarySlipData } from '@/components/salary-slip-pdf'
import { useSendNDA } from '@/features/nda/api/use-send-nda'
import { useSendSalarySlip } from '@/features/salary-slip/api/use-send-salary-slip'
import { useGetAttendance } from '@/features/attendance/api/use-get-attendance'

interface MemberDetailClientProps {
  workspaceId: string
  userId: string
}

export const MemberDetailClient = ({ workspaceId, userId }: MemberDetailClientProps) => {
  const { data: memberDetail, isLoading: isLoadingDetail } = useGetMemberDetail(userId)
  const { data: isAdmin } = useAdminStatus()
  const { mutate: sendNDA, isPending: isSendingNDA } = useSendNDA()
  const { mutate: sendSalarySlip, isPending: isSendingSalarySlip } = useSendSalarySlip()
  const { mutate: updateMemberInfo, isPending: isUpdatingInfo } = useUpdateMemberInfo()
  const { mutate: updateMemberStatus, isPending: isUpdatingStatus } = useUpdateMemberStatus()

  // Extract member from detail
  const member = memberDetail

  // Initialize memberInfo from database or defaults
  const [memberInfo, setMemberInfo] = useState({
    position: memberDetail?.position || '',
    address: memberDetail?.address || '',
    aadhar: memberDetail?.aadhar || '',
    phoneNumber: memberDetail?.phoneNumber || '',
    basicSalary: memberDetail?.basicSalary || 0,
    hra: memberDetail?.hra || 0,
    transportAllowance: memberDetail?.transportAllowance || 0,
    medicalAllowance: memberDetail?.medicalAllowance || 0,
    providentFund: memberDetail?.providentFund || 0,
    professionalTax: memberDetail?.professionalTax || 0,
    incomeTax: memberDetail?.incomeTax || 0,
    accountNumber: memberDetail?.accountNumber || '',
    ifsc: memberDetail?.ifsc || '',
    bankName: memberDetail?.bankName || BANK_DETAILS.bankName,
  })

  // Update local state when memberDetail changes
  useEffect(() => {
    if (memberDetail) {
      setMemberInfo({
        position: memberDetail.position || '',
        address: memberDetail.address || '',
        aadhar: memberDetail.aadhar || '',
        phoneNumber: memberDetail.phoneNumber || '',
        basicSalary: memberDetail.basicSalary || 0,
        hra: memberDetail.hra || 0,
        transportAllowance: memberDetail.transportAllowance || 0,
        medicalAllowance: memberDetail.medicalAllowance || 0,
        providentFund: memberDetail.providentFund || 0,
        professionalTax: memberDetail.professionalTax || 0,
        incomeTax: memberDetail.incomeTax || 0,
        accountNumber: memberDetail.accountNumber || '',
        ifsc: memberDetail.ifsc || '',
        bankName: memberDetail.bankName || BANK_DETAILS.bankName,
      })
    }
  }, [memberDetail])

  const [ndaDate, setNdaDate] = useState<Date>(new Date())
  const [ndaDateOpen, setNdaDateOpen] = useState(false)
  const [joiningLetterDate, setJoiningLetterDate] = useState<Date>(new Date())
  const [joiningLetterDateOpen, setJoiningLetterDateOpen] = useState(false)
  const [salarySlipMonth, setSalarySlipMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  )
  const [salarySlipYear, setSalarySlipYear] = useState<string>(new Date().getFullYear().toString())
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleGenerateNDA = async (sendViaEmail = false) => {
    if (!member) return

    if (!memberInfo.address || !memberInfo.aadhar) {
      toast.error('Please fill in employee address and Aadhar number in the Overview tab')
      return
    }

    if (memberInfo.aadhar.length !== 12 || !/^\d+$/.test(memberInfo.aadhar)) {
      toast.error('Aadhar number must be exactly 12 digits')
      return
    }

    setIsGenerating(true)
    try {
      const formattedDate = format(ndaDate, 'MMM dd, yyyy')

      const ndaData: NDAData = {
        employeeName: member.name,
        employeeAddress: memberInfo.address,
        employeeAadhar: memberInfo.aadhar,
        effectiveDate: formattedDate,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      const doc = <NDAPDF {...ndaData} />
      const pdfBlob = await pdf(doc).toBlob()

      if (sendViaEmail) {
        const pdfBase64 = await pdfBlobToBase64(pdfBlob)
        sendNDA(
          {
            employeeName: member.name,
            employeeEmail: member.email,
            employeeAddress: memberInfo.address,
            employeeAadhar: memberInfo.aadhar,
            effectiveDate: formattedDate,
            pdfBase64,
          },
          {
            onSuccess: () => {
              toast.success('NDA sent successfully to employee email')
            },
            onError: () => {
              toast.error('Failed to send NDA')
            },
          }
        )
      } else {
        const filename = generateSafeFilename(`NDA-${member.name}`, 'pdf')
        downloadPDF(pdfBlob, filename)
        toast.success('NDA PDF downloaded successfully')
      }
    } catch (error) {
      console.error('Error generating NDA:', error)
      toast.error('Failed to generate NDA. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateJoiningLetter = async () => {
    if (!memberDetail) return

    if (!memberInfo.address || !memberInfo.position) {
      toast.error('Please fill in employee address and position in the Overview tab')
      return
    }

    setIsGenerating(true)
    try {
      const formattedDate = formatDateWithOrdinal(joiningLetterDate)

      const letterData: JoiningLetterData = {
        employeeName: memberDetail.name,
        employeeEmail: memberDetail.email,
        employeeAddress: memberInfo.address,
        position: memberInfo.position,
        date: formattedDate,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      const doc = <JoiningLetterPDF {...letterData} />
      const pdfBlob = await pdf(doc).toBlob()

      const filename = generateSafeFilename(`Joining-Letter-${memberDetail.name}`, 'pdf')
      downloadPDF(pdfBlob, filename)
      toast.success('Joining Letter PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating joining letter:', error)
      toast.error('Failed to generate joining letter. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateSalarySlip = async (sendViaEmail = false) => {
    if (!memberDetail) return

    if (!memberInfo.basicSalary) {
      toast.error('Please fill in basic salary in the Overview tab')
      return
    }

    setIsGenerating(true)
    try {
      // Get month index (0-based) from month name
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const monthIndex = monthNames.indexOf(salarySlipMonth)
      if (monthIndex === -1) {
        toast.error('Invalid month selected')
        setIsGenerating(false)
        return
      }

      const year = parseInt(salarySlipYear)
      if (isNaN(year)) {
        toast.error('Invalid year')
        setIsGenerating(false)
        return
      }

      // Calculate start and end dates for the selected month
      const startDate = new Date(year, monthIndex, 1)
      const endDate = new Date(year, monthIndex + 1, 0) // Last day of the month
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')

      // Fetch attendance data for the selected month
      let totalPresentDays = 0
      let totalWorkedHours = 0

      try {
        const attendanceResponse = await fetch(
          `/api/attendance?workspaceId=${workspaceId}&userId=${memberDetail.userId}&startDate=${startDateStr}&endDate=${endDateStr}`
        )

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json()

          // Calculate total present days (present, late, or half-day are considered present)
          totalPresentDays = attendanceData.filter((record: any) =>
            record.status === 'present' || record.status === 'late' || record.status === 'half-day'
          ).length

          // Calculate total worked hours
          totalWorkedHours = attendanceData.reduce((sum: number, record: any) => {
            return sum + (record.totalHours || 0)
          }, 0)
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error)
        // Continue without attendance data if fetch fails
      }

      // Create date for the first day of the selected month
      const payDate = new Date(year, monthIndex, 1)
      const formattedPayDate = format(payDate, 'MMM dd, yyyy')

      // Calculate totals
      const totalEarnings =
        (memberInfo.basicSalary || 0) +
        (memberInfo.hra || 0) +
        (memberInfo.transportAllowance || 0) +
        (memberInfo.medicalAllowance || 0)

      const totalDeductions =
        (memberInfo.providentFund || 0) +
        (memberInfo.professionalTax || 0) +
        (memberInfo.incomeTax || 0)

      const netSalary = totalEarnings - totalDeductions

      const salarySlipData: SalarySlipData = {
        employeeName: memberDetail.name,
        employeeEmail: memberDetail.email,
        employeePhone: memberDetail.phoneNumber,
        designation: memberInfo.position || 'Employee',
        month: salarySlipMonth,
        year: salarySlipYear,
        payDate: formattedPayDate,
        basicSalary: memberInfo.basicSalary || 0,
        hra: memberInfo.hra || 0,
        transportAllowance: memberInfo.transportAllowance || 0,
        medicalAllowance: memberInfo.medicalAllowance || 0,
        providentFund: memberInfo.providentFund || 0,
        professionalTax: memberInfo.professionalTax || 0,
        incomeTax: memberInfo.incomeTax || 0,
        grossSalary: totalEarnings,
        totalDeductions,
        netSalary,
        accountNumber: memberInfo.accountNumber,
        ifsc: memberInfo.ifsc,
        bankName: memberInfo.bankName || BANK_DETAILS.bankName, // Use member data, fallback to constants
        totalWorkedHours: totalWorkedHours > 0 ? Math.round(totalWorkedHours * 100) / 100 : undefined, // Round to 2 decimal places
        totalPresentDays: totalPresentDays > 0 ? totalPresentDays : undefined,
        logoUrl: COMPANY_INFO.logoUrl,
      }

      const doc = <SalarySlipPDF {...salarySlipData} />
      const pdfBlob = await pdf(doc).toBlob()

      if (sendViaEmail) {
        const pdfBase64 = await pdfBlobToBase64(pdfBlob)
        sendSalarySlip(
          {
            employeeName: memberDetail.name,
            employeeEmail: memberDetail.email,
            month: salarySlipMonth,
            year: salarySlipYear,
            pdfBase64,
          },
          {
            onSuccess: () => {
              toast.success('Salary slip sent successfully to employee email')
            },
            onError: () => {
              toast.error('Failed to send salary slip')
            },
          }
        )
      } else {
        const filename = generateSafeFilename(`Salary-Slip-${memberDetail.name}-${salarySlipMonth}-${salarySlipYear}`, 'pdf')
        downloadPDF(pdfBlob, filename)
        toast.success('Salary slip PDF downloaded successfully')
      }
    } catch (error) {
      console.error('Error generating salary slip:', error)
      toast.error('Failed to generate salary slip. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveInfo = () => {
    if (!memberDetail?.$id) {
      toast.error('Member ID not found')
      return
    }

    updateMemberInfo(
      {
        memberId: memberDetail.$id,
        data: memberInfo,
      },
      {
        onSuccess: () => {
          toast.success('Member information saved successfully')
        },
        onError: () => {
          toast.error('Failed to save member information')
        },
      }
    )
  }

  if (isLoadingDetail) {
    return <div className="text-center py-8">Loading member details...</div>
  }

  if (!memberDetail) {
    return <div className="text-center py-8">Member not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}/members`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Members
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <MemberAvatar name={memberDetail.name} className="size-12" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{memberDetail.name}</h1>
            <p className="text-muted-foreground">{memberDetail.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {memberDetail.role === 'ADMIN' && (
              <Badge variant="secondary">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
            {memberDetail.isActive === false && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                <UserX className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
            {isAdmin && memberDetail.$id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateMemberStatus({
                    json: { isActive: memberDetail.isActive !== false ? false : true },
                    param: { memberId: memberDetail.$id },
                  });
                }}
                disabled={isUpdatingStatus}
                className={memberDetail.isActive === false ? 'text-green-600 border-green-500' : 'text-orange-600 border-orange-500'}
              >
                {memberDetail.isActive === false ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Mark as Active
                  </>
                ) : (
                  <>
                    <UserX className="h-3 w-3 mr-1" />
                    Mark as Inactive
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="mr-2 size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 size-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="attendance" asChild>
            <Link href={`/workspaces/${workspaceId}/members/${userId}/attendance`}>
              <Calendar className="mr-2 size-4" />
              Attendance
            </Link>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>Basic member details from the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{memberDetail.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="font-medium">{memberDetail.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {memberDetail.isActive === false ? (
                    <UserX className="h-4 w-4 text-orange-500" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge variant={memberDetail.isActive === false ? 'outline' : 'default'} className={memberDetail.isActive === false ? 'border-orange-500 text-orange-600' : ''}>
                      {memberDetail.isActive === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                {isAdmin ? 'Edit employee personal details' : 'Employee personal details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Position / Designation
                  </Label>
                  {isAdmin ? (
                    <Input
                      id="position"
                      value={memberInfo.position}
                      onChange={(e) => setMemberInfo({ ...memberInfo, position: e.target.value })}
                      placeholder="Web Developer"
                    />
                  ) : (
                    <p className="font-medium">{memberInfo.position || 'Not set'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar">
                    <Hash className="inline h-4 w-4 mr-1" />
                    Aadhar Number
                  </Label>
                  {isAdmin ? (
                    <Input
                      id="aadhar"
                      value={memberInfo.aadhar}
                      onChange={(e) => setMemberInfo({ ...memberInfo, aadhar: e.target.value })}
                      placeholder="12-digit Aadhar number"
                      maxLength={12}
                    />
                  ) : (
                    <p className="font-medium">{memberInfo.aadhar || 'Not set'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    <MailIcon className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  {isAdmin ? (
                    <Input
                      id="phoneNumber"
                      type="text"
                      value={memberInfo.phoneNumber}
                      onChange={(e) => setMemberInfo({ ...memberInfo, phoneNumber: e.target.value })}
                      placeholder="Phone number"
                    />
                  ) : (
                    <p className="font-medium">{memberInfo.phoneNumber || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Address
                </Label>
                {isAdmin ? (
                  <Textarea
                    id="address"
                    value={memberInfo.address}
                    onChange={(e) => setMemberInfo({ ...memberInfo, address: e.target.value })}
                    placeholder="Complete address with postal details"
                    rows={3}
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{memberInfo.address || 'Not set'}</p>
                )}
              </div>

              {isAdmin && (
                <Button onClick={handleSaveInfo} variant="outline" disabled={isUpdatingInfo || !memberDetail?.$id}>
                  {isUpdatingInfo ? 'Saving...' : 'Save Personal Information'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Salary Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Salary Information
              </CardTitle>
              <CardDescription>
                {isAdmin ? 'Edit employee salary details' : 'Employee salary details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display Earnings */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Earnings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="basicSalary"
                        type="text"
                        value={memberInfo.basicSalary || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, basicSalary: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="20000"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.basicSalary?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="hra"
                        type="text"
                        value={memberInfo.hra || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, hra: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="8000"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.hra?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportAllowance">Transport Allowance (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="transportAllowance"
                        type="text"
                        value={memberInfo.transportAllowance || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, transportAllowance: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="2000"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.transportAllowance?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalAllowance">Medical Allowance (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="medicalAllowance"
                        type="text"
                        value={memberInfo.medicalAllowance || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, medicalAllowance: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="1500"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.medicalAllowance?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Deductions */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Deductions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="providentFund">Provident Fund (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="providentFund"
                        type="text"
                        value={memberInfo.providentFund || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, providentFund: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="2400"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.providentFund?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalTax">Professional Tax (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="professionalTax"
                        type="text"
                        value={memberInfo.professionalTax || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, professionalTax: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="200"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.professionalTax?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomeTax">Income Tax / TDS (₹)</Label>
                    {isAdmin ? (
                      <Input
                        id="incomeTax"
                        type="text"
                        value={memberInfo.incomeTax || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          setMemberInfo({ ...memberInfo, incomeTax: value ? parseFloat(value) : 0 })
                        }}
                        placeholder="0"
                      />
                    ) : (
                      <p className="font-medium">₹{memberInfo.incomeTax?.toLocaleString('en-IN') || '0'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              {(memberInfo.basicSalary || memberInfo.hra || memberInfo.transportAllowance || memberInfo.medicalAllowance) > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Gross Salary</Label>
                      <p className="font-semibold text-lg">
                        ₹{(
                          (memberInfo.basicSalary || 0) +
                          (memberInfo.hra || 0) +
                          (memberInfo.transportAllowance || 0) +
                          (memberInfo.medicalAllowance || 0)
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Deductions</Label>
                      <p className="font-semibold text-lg text-red-600">
                        ₹{(
                          (memberInfo.providentFund || 0) +
                          (memberInfo.professionalTax || 0) +
                          (memberInfo.incomeTax || 0)
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Net Salary</Label>
                      <p className="font-semibold text-xl text-green-600">
                        ₹{(
                          (memberInfo.basicSalary || 0) +
                          (memberInfo.hra || 0) +
                          (memberInfo.transportAllowance || 0) +
                          (memberInfo.medicalAllowance || 0) -
                          (memberInfo.providentFund || 0) -
                          (memberInfo.professionalTax || 0) -
                          (memberInfo.incomeTax || 0)
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Information */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3">Bank Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    {isAdmin ? (
                      <Input
                        id="bankName"
                        type="text"
                        value={memberInfo.bankName || ''}
                        onChange={(e) => setMemberInfo({ ...memberInfo, bankName: e.target.value })}
                        placeholder="Bank name"
                      />
                    ) : (
                      <p className="font-medium">{memberInfo.bankName || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Bank Account Number</Label>
                    {isAdmin ? (
                      <Input
                        id="accountNumber"
                        type="text"
                        value={memberInfo.accountNumber || ''}
                        onChange={(e) => setMemberInfo({ ...memberInfo, accountNumber: e.target.value })}
                        placeholder="Account number"
                      />
                    ) : (
                      <p className="font-medium">{memberInfo.accountNumber || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    {isAdmin ? (
                      <Input
                        id="ifsc"
                        type="text"
                        value={memberInfo.ifsc || ''}
                        onChange={(e) => setMemberInfo({ ...memberInfo, ifsc: e.target.value })}
                        placeholder="IFSC code"
                      />
                    ) : (
                      <p className="font-medium">{memberInfo.ifsc || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button onClick={handleSaveInfo} variant="outline" disabled={isUpdatingInfo || !memberDetail?.$id}>
                  {isUpdatingInfo ? 'Saving...' : 'Save Salary Information'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {!isAdmin && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                You need admin privileges to generate documents.
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              {/* NDA Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Non-Disclosure Agreement (NDA)
                  </CardTitle>
                  <CardDescription>
                    Generate and send NDA to the employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Popover open={ndaDateOpen} onOpenChange={setNdaDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !ndaDate && 'text-muted-foreground'
                          )}
                        >
                          {ndaDate ? format(ndaDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={ndaDate}
                          onSelect={(date) => {
                            if (date) {
                              setNdaDate(date)
                              setNdaDateOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleGenerateNDA(false)}
                      disabled={isGenerating || isSendingNDA}
                      variant="outline"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 size-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerateNDA(true)}
                      disabled={isGenerating || isSendingNDA}
                    >
                      {isGenerating || isSendingNDA ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <MailIcon className="mr-2 size-4" />
                          Send via Email
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Joining Letter Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Probation Period Joining Letter
                  </CardTitle>
                  <CardDescription>
                    Generate joining letter for the employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Letter Date</Label>
                    <Popover open={joiningLetterDateOpen} onOpenChange={setJoiningLetterDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !joiningLetterDate && 'text-muted-foreground'
                          )}
                        >
                          {joiningLetterDate ? format(joiningLetterDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={joiningLetterDate}
                          onSelect={(date) => {
                            if (date) {
                              setJoiningLetterDate(date)
                              setJoiningLetterDateOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleGenerateJoiningLetter}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 size-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Salary Slip Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Salary Slip
                  </CardTitle>
                  <CardDescription>
                    Generate salary slip for the employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select value={salarySlipMonth} onValueChange={setSalarySlipMonth}>
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
                      <Label>Year</Label>
                      <Input
                        type="text"
                        value={salarySlipYear}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '')
                          setSalarySlipYear(value)
                        }}
                        placeholder="2025"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleGenerateSalarySlip(false)}
                      disabled={isGenerating || isSendingSalarySlip}
                      variant="outline"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 size-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerateSalarySlip(true)}
                      disabled={isGenerating || isSendingSalarySlip}
                    >
                      {isGenerating || isSendingSalarySlip ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <MailIcon className="mr-2 size-4" />
                          Send via Email
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
