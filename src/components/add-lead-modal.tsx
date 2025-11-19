"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import { CreateLeadData, LeadSource, LeadStatus, LeadPriority, validateCreateLead } from "../../data/lead-schema"
import { useCreateLead } from "@/features/leads/api/use-create-lead"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useGetMembers } from "@/features/members/api/use-get-members"

interface AddLeadModalProps {
    onSuccess?: () => void
}

export function AddLeadModal({ onSuccess }: AddLeadModalProps) {
    const workspaceId = useWorkspaceId()
    const { mutate: createLead, isPending: isSubmitting } = useCreateLead()
    const { data: members } = useGetMembers({ workspaceId })
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState<CreateLeadData>({
        name: "",
        email: "",
        phone: "",
        company: "",
        website: "",
        source: LeadSource.OTHER,
        status: LeadStatus.NEW,
        priority: LeadPriority.MEDIUM,
        description: "",
        notes: "",
        assigneeIds: [],
    })
    const [errors, setErrors] = useState<Partial<Record<keyof CreateLeadData, string>>>({})

    const handleInputChange = (field: keyof CreateLeadData, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Filter out inactive members for lead assignment
    const memberOptions = members?.documents
        .filter((member) => member.isActive !== false)
        .map((member) => ({
            label: member.name,
            value: member.$id,
        })) || []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        // Validate form data
        const validation = validateCreateLead(formData)

        if (!validation.success) {
            const fieldErrors: Partial<Record<keyof CreateLeadData, string>> = {}
            validation.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof CreateLeadData
                if (field) {
                    fieldErrors[field] = issue.message
                }
            })
            setErrors(fieldErrors)
            return
        }

        if (!workspaceId) {
            toast.error("Workspace ID is required")
            return
        }

        createLead(
            {
                leadData: validation.data,
                workspaceId,
            },
            {
                onSuccess: () => {
                    setOpen(false)
                    setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        company: "",
                        website: "",
                        source: LeadSource.OTHER,
                        status: LeadStatus.NEW,
                        priority: LeadPriority.MEDIUM,
                        description: "",
                        notes: "",
                        assigneeIds: [],
                    })
                    onSuccess?.()
                },
            }
        )
    }



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                        Create a new lead with all the necessary information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={formData.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("phone", e.target.value)}
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone}</p>
                            )}
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                placeholder="Acme Corp"
                                value={formData.company}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("company", e.target.value)}
                            />
                            {errors.company && (
                                <p className="text-sm text-destructive">{errors.company}</p>
                            )}
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("website", e.target.value)}
                            />
                            {errors.website && (
                                <p className="text-sm text-destructive">{errors.website}</p>
                            )}
                        </div>

                        {/* Source */}
                        <div className="space-y-2">
                            <Label htmlFor="source">Source</Label>
                            <Select
                                value={formData.source}
                                onValueChange={(value) => handleInputChange("source", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={LeadSource.WEBSITE}>Website</SelectItem>
                                    <SelectItem value={LeadSource.REFERRAL}>Referral</SelectItem>
                                    <SelectItem value={LeadSource.SOCIAL_MEDIA}>Social Media</SelectItem>
                                    <SelectItem value={LeadSource.EMAIL}>Email</SelectItem>
                                    <SelectItem value={LeadSource.PHONE}>Phone</SelectItem>
                                    <SelectItem value={LeadSource.OTHER}>Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleInputChange("status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                                    <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
                                    <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
                                    <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
                                    <SelectItem value={LeadStatus.NEGOTIATION}>Negotiation</SelectItem>
                                    <SelectItem value={LeadStatus.CLOSED_WON}>Closed Won</SelectItem>
                                    <SelectItem value={LeadStatus.CLOSED_LOST}>Closed Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => handleInputChange("priority", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={LeadPriority.LOW}>Low</SelectItem>
                                    <SelectItem value={LeadPriority.MEDIUM}>Medium</SelectItem>
                                    <SelectItem value={LeadPriority.HIGH}>High</SelectItem>
                                    <SelectItem value={LeadPriority.URGENT}>Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the lead..."
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes..."
                            value={formData.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                            rows={3}
                        />
                        {errors.notes && (
                            <p className="text-sm text-destructive">{errors.notes}</p>
                        )}
                    </div>

                    {/* Assignees */}
                    <div className="space-y-2">
                        <Label>Assignees</Label>
                        <MultiSelect
                            options={memberOptions}
                            selected={formData.assigneeIds}
                            onChange={(value) => handleInputChange("assigneeIds", value)}
                            placeholder="Select assignees"
                        />
                        {errors.assigneeIds && (
                            <p className="text-sm text-destructive">{errors.assigneeIds}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Lead"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 
