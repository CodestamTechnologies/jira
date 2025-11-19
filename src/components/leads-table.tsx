"use client"

import { format } from "date-fns"
import { Edit, ExternalLink, Mail, MessageSquare, MoreHorizontal, Phone, RefreshCw, Search, Trash2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MemberAvatar } from "@/features/members/components/member-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { Lead } from "../../data/lead-schema"
import { LeadPriority, LeadSource, LeadStatus } from "../../data/lead-schema"
import { toast } from "sonner"
import { LeadCommentsModal } from "@/components/lead-comments-modal"
import { useGetLeads } from "@/features/leads/api/use-get-leads"
import { useDeleteLead } from "@/features/leads/api/use-delete-lead"
import { useEditLeadModal } from "@/features/leads/hooks/use-edit-lead-modal"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useAdminStatus } from "@/features/attendance/hooks/use-admin-status"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { useCurrent } from "@/features/auth/api/use-current"

interface FilterState {
    search: string
    status: string
    priority: string
    source: string
}

export function LeadsTable() {
    const workspaceId = useWorkspaceId()
    const { data: leadsData, isLoading: loading, error, refetch } = useGetLeads({ workspaceId })
    const { mutate: deleteLead } = useDeleteLead()
    const { open: openEditLeadModal } = useEditLeadModal()
    const { data: isAdmin } = useAdminStatus()
    const { data: user } = useCurrent()
    const { data: membersData } = useGetMembers({ workspaceId })

    // Get current user's member ID
    const currentMember = membersData?.documents?.find((m) => m.userId === user?.$id)
    const currentMemberId = currentMember?.$id

    // Filter leads: non-admin users only see leads assigned to them
    const leads: Lead[] = useMemo(() => {
        const allLeads = (leadsData?.documents || []) as Lead[]

        // If admin, show all leads; otherwise filter by assignee
        if (isAdmin || !currentMemberId) {
            return allLeads
        }

        // Filter to only show leads where current user is assigned
        return allLeads.filter((lead) => {
            return lead.assigneeIds && lead.assigneeIds.includes(currentMemberId)
        })
    }, [leadsData?.documents, isAdmin, currentMemberId])
    const [refreshing, setRefreshing] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [commentsModalOpen, setCommentsModalOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        status: "all",
        priority: "all",
        source: "all"
    })

    // Apply filters using useMemo to avoid infinite loops
    const filteredLeads = useMemo(() => {
        let filtered = leads

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filtered = filtered.filter(lead =>
                lead.name.toLowerCase().includes(searchLower) ||
                lead.email.toLowerCase().includes(searchLower) ||
                lead.company?.toLowerCase().includes(searchLower) ||
                lead.phone?.toLowerCase().includes(searchLower)
            )
        }

        // Status filter
        if (filters.status !== "all") {
            filtered = filtered.filter(lead => lead.status === filters.status)
        }

        // Priority filter
        if (filters.priority !== "all") {
            filtered = filtered.filter(lead => lead.priority === filters.priority)
        }

        // Source filter
        if (filters.source !== "all") {
            filtered = filtered.filter(lead => lead.source === filters.source)
        }

        return filtered
    }, [leads, filters.search, filters.status, filters.priority, filters.source])

    const refreshLeads = async () => {
        setRefreshing(true)
        // Trigger refetch from the hook
        if (refetch) {
            await refetch()
            toast.success("Leads refreshed")
        }
        setRefreshing(false)
    }

    const handleDeleteLead = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete lead "${name}"? This action cannot be undone.`)) {
            deleteLead({ leadId: id, workspaceId }, {
                onSuccess: () => {
                    toast.success(`Lead "${name}" deleted successfully`)
                    refetch()
                },
            })
        }
    }

    const handleViewComments = (lead: Lead) => {
        setSelectedLead(lead)
        setCommentsModalOpen(true)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            [LeadStatus.NEW]: { label: "New", variant: "default" as const },
            [LeadStatus.CONTACTED]: { label: "Contacted", variant: "secondary" as const },
            [LeadStatus.QUALIFIED]: { label: "Qualified", variant: "default" as const },
            [LeadStatus.PROPOSAL]: { label: "Proposal", variant: "secondary" as const },
            [LeadStatus.NEGOTIATION]: { label: "Negotiation", variant: "outline" as const },
            [LeadStatus.CLOSED_WON]: { label: "Closed Won", variant: "default" as const },
            [LeadStatus.CLOSED_LOST]: { label: "Closed Lost", variant: "destructive" as const },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            [LeadPriority.LOW]: { label: "Low", variant: "secondary" as const },
            [LeadPriority.MEDIUM]: { label: "Medium", variant: "default" as const },
            [LeadPriority.HIGH]: { label: "High", variant: "outline" as const },
            [LeadPriority.URGENT]: { label: "Urgent", variant: "destructive" as const },
        }

        const config = priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, variant: "secondary" as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getSourceBadge = (source: string) => {
        const sourceConfig = {
            [LeadSource.WEBSITE]: { label: "Website", variant: "default" as const },
            [LeadSource.REFERRAL]: { label: "Referral", variant: "secondary" as const },
            [LeadSource.SOCIAL_MEDIA]: { label: "Social Media", variant: "outline" as const },
            [LeadSource.EMAIL]: { label: "Email", variant: "secondary" as const },
            [LeadSource.PHONE]: { label: "Phone", variant: "outline" as const },
            [LeadSource.OTHER]: { label: "Other", variant: "secondary" as const },
        }

        const config = sourceConfig[source as keyof typeof sourceConfig] || { label: source, variant: "secondary" as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </div>
                <div className="rounded-md border">
                    <div className="h-96 bg-muted animate-pulse rounded" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">Error loading leads: {error?.message || 'Unknown error'}</div>
                <Button onClick={refreshLeads} variant="outline">
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2 md:space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col gap-2 md:flex-row md:gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:gap-4 flex-1 w-full">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:max-w-sm">
                        <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-7 md:pl-10 h-8 md:h-10 text-sm"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {/* Status Filter */}
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger className="w-full sm:w-28 md:w-32 h-8 md:h-10 text-xs md:text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                                <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
                                <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
                                <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
                                <SelectItem value={LeadStatus.NEGOTIATION}>Negotiation</SelectItem>
                                <SelectItem value={LeadStatus.CLOSED_WON}>Closed Won</SelectItem>
                                <SelectItem value={LeadStatus.CLOSED_LOST}>Closed Lost</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select
                            value={filters.priority}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                        >
                            <SelectTrigger className="w-full sm:w-28 md:w-32 h-8 md:h-10 text-xs md:text-sm">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value={LeadPriority.LOW}>Low</SelectItem>
                                <SelectItem value={LeadPriority.MEDIUM}>Medium</SelectItem>
                                <SelectItem value={LeadPriority.HIGH}>High</SelectItem>
                                <SelectItem value={LeadPriority.URGENT}>Urgent</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Source Filter */}
                        <Select
                            value={filters.source}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
                        >
                            <SelectTrigger className="w-full sm:w-28 md:w-32 h-8 md:h-10 text-xs md:text-sm">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value={LeadSource.WEBSITE}>Website</SelectItem>
                                <SelectItem value={LeadSource.REFERRAL}>Referral</SelectItem>
                                <SelectItem value={LeadSource.SOCIAL_MEDIA}>Social Media</SelectItem>
                                <SelectItem value={LeadSource.EMAIL}>Email</SelectItem>
                                <SelectItem value={LeadSource.PHONE}>Phone</SelectItem>
                                <SelectItem value={LeadSource.OTHER}>Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshLeads}
                    disabled={refreshing}
                    className="flex items-center gap-1 md:gap-2 h-8 md:h-10 text-xs md:text-sm w-full sm:w-auto"
                >
                    <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Results Count */}
            <div className="text-xs md:text-sm text-muted-foreground">
                Showing {filteredLeads.length} of {leads.length} leads
                {!isAdmin && " (your leads only)"}
            </div>

            {/* Leads Table - Desktop */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Assignees</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    {filters.search || filters.status !== "all" || filters.priority !== "all" || filters.source !== "all"
                                        ? "No leads match your filters"
                                        : "No leads found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLeads.map((lead) => (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <Link href={`/workspaces/${workspaceId}/leads/${lead.id}`} className="block">
                                            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="" alt={lead.name} />
                                                    <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{lead.name}</div>
                                                    <div className="text-sm text-muted-foreground">{lead.company || "No company"}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-3 w-3" />
                                                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                                                    {lead.email}
                                                </a>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-3 w-3" />
                                                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                                                        {lead.phone}
                                                    </a>
                                                </div>
                                            )}
                                            {lead.website && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <ExternalLink className="h-3 w-3" />
                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                        Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(lead.status)}
                                    </TableCell>
                                    <TableCell>
                                        {getPriorityBadge(lead.priority)}
                                    </TableCell>
                                    <TableCell>
                                        {getSourceBadge(lead.source)}
                                    </TableCell>
                                    <TableCell>
                                        {lead.assignees && lead.assignees.length > 0 ? (
                                            <div className="flex items-center -space-x-1">
                                                {lead.assignees.slice(0, 3).map((assignee, index) => (
                                                    <MemberAvatar
                                                        key={assignee.$id}
                                                        name={assignee.name}
                                                        className={index > 0 ? '-ml-1.5' : ''}
                                                        fallbackClassName="text-xs"
                                                    />
                                                ))}
                                                {lead.assignees.length > 3 && (
                                                    <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-muted-foreground">
                                                        +{lead.assignees.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEditLeadModal(lead.id)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit lead
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewComments(lead)}>
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    Comments ({lead.comments.length})
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteLead(lead.id, lead.name)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete lead
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Leads Cards - Mobile */}
            <div className="md:hidden space-y-2">
                {filteredLeads.length === 0 ? (
                    <div className="rounded-md border p-4 text-center text-xs text-muted-foreground">
                        {filters.search || filters.status !== "all" || filters.priority !== "all" || filters.source !== "all"
                            ? "No leads match your filters"
                            : "No leads found"}
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <div key={lead.id} className="rounded-md border p-2 space-y-2">
                            {/* Header with Name and Actions */}
                            <div className="flex items-start justify-between gap-2">
                                <Link href={`/workspaces/${workspaceId}/leads/${lead.id}`} className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage src="" alt={lead.name} />
                                            <AvatarFallback className="text-[10px]">{getInitials(lead.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm truncate">{lead.name}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{lead.company || "No company"}</div>
                                        </div>
                                    </div>
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-6 w-6 p-0 flex-shrink-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => openEditLeadModal(lead.id)}>
                                            <Edit className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Edit lead</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewComments(lead)}>
                                            <MessageSquare className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Comments ({lead.comments.length})</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Delete lead</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px]">
                                    <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline truncate">
                                        {lead.email}
                                    </a>
                                </div>
                                {lead.phone && (
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                        <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                                            {lead.phone}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {getStatusBadge(lead.status)}
                                {getPriorityBadge(lead.priority)}
                                {getSourceBadge(lead.source)}
                            </div>

                            {/* Footer with Assignees and Date */}
                            <div className="flex items-center justify-between pt-1 border-t">
                                <div className="flex items-center gap-1.5">
                                    {lead.assignees && lead.assignees.length > 0 ? (
                                        <>
                                            <div className="flex items-center -space-x-1">
                                                {lead.assignees.slice(0, 2).map((assignee, index) => (
                                                    <MemberAvatar
                                                        key={assignee.$id}
                                                        name={assignee.name}
                                                        className={`${index > 0 ? '-ml-1' : ''} h-4 w-4`}
                                                        fallbackClassName="text-[8px]"
                                                    />
                                                ))}
                                            </div>
                                            {lead.assignees.length > 2 && (
                                                <span className="text-[8px] text-muted-foreground">+{lead.assignees.length - 2}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">Unassigned</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comments Modal */}
            {selectedLead && (
                <LeadCommentsModal
                    lead={selectedLead}
                    open={commentsModalOpen}
                    onOpenChange={setCommentsModalOpen}
                />
            )}
        </div>
    )
} 
