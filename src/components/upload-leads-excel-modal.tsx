"use client"

import { useState, useRef } from "react"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { LeadSource, LeadStatus, LeadPriority } from "../../data/lead-schema"
import { useBulkCreateLeads } from "@/features/leads/api/use-bulk-create-leads"

interface UploadLeadsExcelModalProps {
    onSuccess?: () => void
}

export function UploadLeadsExcelModal({ onSuccess }: UploadLeadsExcelModalProps) {
    const workspaceId = useWorkspaceId()
    const { data: members } = useGetMembers({ workspaceId })
    const { mutate: bulkCreateLeads, isPending: isUploading } = useBulkCreateLeads()
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState<{
        success: number
        failed: number
        errors: string[]
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const downloadTemplate = () => {
        // Create Excel template with proper CSV format
        const headers = [
            'Name',
            'Email',
            'Phone',
            'Company',
            'Website',
            'Source',
            'Status',
            'Priority',
            'Description',
            'Notes',
            'Assignee Emails'
        ]

        // Create CSV content with proper escaping for values with commas
        const escapeCSV = (value: string): string => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return value
        }

        const csvRows = [
            headers.map(escapeCSV).join(','),
            [
                'John Doe',
                'john@example.com',
                '+1 (555) 123-4567',
                'Acme Corp',
                'https://acme.com',
                'website',
                'new',
                'medium',
                'Sample description',
                'Sample notes',
                'user1@example.com,user2@example.com'
            ].map(escapeCSV).join(','),
            [
                'Jane Smith',
                'jane@example.com',
                '+1 (555) 987-6543',
                'Tech Inc',
                'https://techinc.com',
                'referral',
                'contacted',
                'high',
                'Another description',
                'More notes',
                'user1@example.com'
            ].map(escapeCSV).join(',')
        ]

        const csvContent = csvRows.join('\n')
        const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility

        // Create blob and download
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'leads_template.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success('Template downloaded successfully!')
    }

    // Simple CSV parser that handles quoted values
    const parseCSVLine = (line: string): string[] => {
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"'
                    i++
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                values.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        
        // Add last field
        values.push(current.trim())
        return values
    }

    const parseExcelFile = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string
                    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
                    
                    if (lines.length < 2) {
                        reject(new Error('File must contain at least a header row and one data row'))
                        return
                    }

                    // Parse header
                    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''))
                    
                    // Find column indices
                    const nameIdx = headers.findIndex(h => h.includes('name'))
                    const emailIdx = headers.findIndex(h => h.includes('email'))
                    const phoneIdx = headers.findIndex(h => h.includes('phone'))
                    const companyIdx = headers.findIndex(h => h.includes('company'))
                    const websiteIdx = headers.findIndex(h => h.includes('website'))
                    const sourceIdx = headers.findIndex(h => h.includes('source'))
                    const statusIdx = headers.findIndex(h => h.includes('status'))
                    const priorityIdx = headers.findIndex(h => h.includes('priority'))
                    const descriptionIdx = headers.findIndex(h => h.includes('description'))
                    const notesIdx = headers.findIndex(h => h.includes('notes'))
                    const assigneeIdx = headers.findIndex(h => h.includes('assignee'))

                    if (nameIdx === -1 || emailIdx === -1) {
                        reject(new Error('File must contain Name and Email columns'))
                        return
                    }

                    // Parse data rows
                    const leads: any[] = []
                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
                        
                        const name = values[nameIdx]?.trim()
                        const email = values[emailIdx]?.trim()

                        if (!name || !email) {
                            continue // Skip rows without name or email
                        }

                        // Parse assignee emails (comma-separated)
                        const assigneeEmails = values[assigneeIdx] 
                            ? values[assigneeIdx].split(',').map((e: string) => e.trim()).filter((e: string) => e && e.includes('@'))
                            : []

                        leads.push({
                            name,
                            email,
                            phone: values[phoneIdx] || '',
                            company: values[companyIdx] || '',
                            website: values[websiteIdx] || '',
                            source: values[sourceIdx] || LeadSource.OTHER,
                            status: values[statusIdx] || LeadStatus.NEW,
                            priority: values[priorityIdx] || LeadPriority.MEDIUM,
                            description: values[descriptionIdx] || '',
                            notes: values[notesIdx] || '',
                            assigneeEmails, // Will be converted to IDs on server
                        })
                    }

                    if (leads.length === 0) {
                        reject(new Error('No valid leads found in the file'))
                        return
                    }

                    resolve(leads)
                } catch (error: any) {
                    reject(new Error(`Failed to parse file: ${error.message}`))
                }
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                toast.error('Please upload a CSV or Excel file')
                return
            }
            setFile(selectedFile)
            setUploadStatus(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file')
            return
        }

        if (!workspaceId) {
            toast.error('Workspace ID is required')
            return
        }

        try {
            const leads = await parseExcelFile(file)
            
            if (leads.length === 0) {
                toast.error('No valid leads found in the file')
                return
            }

            bulkCreateLeads(
                {
                    leads,
                    workspaceId,
                },
                {
                    onSuccess: (data) => {
                        setUploadStatus({
                            success: data.data?.success || 0,
                            failed: data.data?.failed || 0,
                            errors: data.data?.errors || [],
                        })
                        toast.success(`Successfully uploaded ${data.data?.success || 0} leads!`)
                        if (data.data?.failed === 0) {
                            setOpen(false)
                            setFile(null)
                            setUploadStatus(null)
                            if (fileInputRef.current) {
                                fileInputRef.current.value = ''
                            }
                            onSuccess?.()
                        }
                    },
                    onError: (error) => {
                        toast.error(error.message || 'Failed to upload leads')
                    },
                }
            )
        } catch (error: any) {
            toast.error(error.message || 'Failed to parse file')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload via Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Upload Leads via Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload multiple leads at once using an Excel or CSV file. Download the template to see the required format.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Download className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Download template to see the required format</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select File</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {file && (
                            <p className="text-xs text-muted-foreground">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    {/* Upload Status */}
                    {uploadStatus && (
                        <div className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                {uploadStatus.failed === 0 ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                                Upload Complete
                            </div>
                            <div className="text-sm space-y-1">
                                <p className="text-green-600">✓ {uploadStatus.success} leads uploaded successfully</p>
                                {uploadStatus.failed > 0 && (
                                    <p className="text-red-600">✗ {uploadStatus.failed} leads failed to upload</p>
                                )}
                                {uploadStatus.errors.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Errors:</p>
                                        {uploadStatus.errors.slice(0, 5).map((error, idx) => (
                                            <p key={idx} className="text-xs text-red-600">{error}</p>
                                        ))}
                                        {uploadStatus.errors.length > 5 && (
                                            <p className="text-xs text-muted-foreground">
                                                ... and {uploadStatus.errors.length - 5} more errors
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-xs font-medium mb-2">Instructions:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Name and Email are required fields</li>
                            <li>For Assignee Emails, separate multiple emails with commas</li>
                            <li>Source values: website, referral, social_media, email, phone, other</li>
                            <li>Status values: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost</li>
                            <li>Priority values: low, medium, high, urgent</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setOpen(false)
                        setFile(null)
                        setUploadStatus(null)
                        if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                        }
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload Leads'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

