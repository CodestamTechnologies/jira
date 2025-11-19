"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadPriority, LeadStatus } from "../../data/lead-schema"
import { MessageSquare, Target, TrendingUp, Users } from "lucide-react"
import { Lead } from "../../data/lead-schema"
import { useGetLeads } from "@/features/leads/api/use-get-leads"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useAdminStatus } from "@/features/attendance/hooks/use-admin-status"

interface LeadsStats {
    totalLeads: number
    newLeads: number
    qualifiedLeads: number
    closedWon: number
    closedLost: number
    highPriority: number
    urgentLeads: number
    totalComments: number
    conversionRate: number
}

export function LeadsStats() {
    const workspaceId = useWorkspaceId()
    const { data: leadsData, isLoading: loading, error } = useGetLeads({ workspaceId })
    const { data: isAdmin } = useAdminStatus()
    const leads = leadsData?.documents || []

    const calculateStats = (leads: Lead[]): LeadsStats => {
        const totalLeads = leads.length
        const newLeads = leads.filter(lead => lead.status === LeadStatus.NEW).length
        const qualifiedLeads = leads.filter(lead => lead.status === LeadStatus.QUALIFIED).length
        const closedWon = leads.filter(lead => lead.status === LeadStatus.CLOSED_WON).length
        const closedLost = leads.filter(lead => lead.status === LeadStatus.CLOSED_LOST).length
        const highPriority = leads.filter(lead => lead.priority === LeadPriority.HIGH).length
        const urgentLeads = leads.filter(lead => lead.priority === LeadPriority.URGENT).length
        const totalComments = leads.reduce((sum, lead) => sum + (lead.comments?.length || 0), 0)
        const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0

        return {
            totalLeads,
            newLeads,
            qualifiedLeads,
            closedWon,
            closedLost,
            highPriority,
            urgentLeads,
            totalComments,
            conversionRate
        }
    }

    const stats = calculateStats(leads)

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-2 md:p-6">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                            <div className="h-3 w-12 md:h-4 md:w-20 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-3 md:h-4 md:w-4 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent className="p-0 pt-1 md:pt-2">
                            <div className="h-6 w-8 md:h-8 md:w-12 bg-muted animate-pulse rounded mb-1 md:mb-2" />
                            <div className="h-2 w-16 md:h-3 md:w-24 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
                <Card className="col-span-2 md:col-span-1">
                    <CardContent className="pt-3 md:pt-6 p-3 md:p-6">
                        <div className="text-center text-xs md:text-sm text-muted-foreground">
                            Error loading stats: {error?.message || 'Unknown error'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
            {/* Total Leads */}
            <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                    <CardTitle className="text-xs md:text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-2">
                    <div className="text-lg md:text-2xl font-bold">{stats.totalLeads}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        {!isAdmin && "Your leads only"}
                    </p>
                </CardContent>
            </Card>

            {/* New Leads */}
            <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                    <CardTitle className="text-xs md:text-sm font-medium">New Leads</CardTitle>
                    <Target className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-2">
                    <div className="text-lg md:text-2xl font-bold">{stats.newLeads}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        {stats.totalLeads > 0 ? Math.round((stats.newLeads / stats.totalLeads) * 100) : 0}% of total
                    </p>
                </CardContent>
            </Card>

            {/* Qualified Leads */}
            <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                    <CardTitle className="text-xs md:text-sm font-medium">Qualified</CardTitle>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-2">
                    <div className="text-lg md:text-2xl font-bold">{stats.qualifiedLeads}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        Ready for proposal
                    </p>
                </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                    <CardTitle className="text-xs md:text-sm font-medium">Conversion Rate</CardTitle>
                    <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-2">
                    <div className="text-lg md:text-2xl font-bold">{stats.conversionRate}%</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        {stats.closedWon} won / {stats.closedLost} lost
                    </p>
                </CardContent>
            </Card>
        </div>
    )
} 
