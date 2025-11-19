'use client';

import { format } from 'date-fns';
import { ArrowLeft, Edit, Mail, Phone, ExternalLink, Building2, Globe, User, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { Separator } from '@/components/ui/separator';
import { useGetLead } from '@/features/leads/api/use-get-lead';
import { useLeadId } from '@/features/leads/hooks/use-lead-id';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useEditLeadModal } from '@/features/leads/hooks/use-edit-lead-modal';
import { LeadCommentsModal } from '@/components/lead-comments-modal';
import { useState } from 'react';
import { LeadPriority, LeadSource, LeadStatus } from '../../../../../../../data/lead-schema';
type BadgeConfig = { label: string; variant: BadgeProps['variant'] };
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, BadgeConfig> = {
    [LeadStatus.NEW]: { label: 'New', variant: 'default' },
    [LeadStatus.CONTACTED]: { label: 'Contacted', variant: 'secondary' },
    [LeadStatus.QUALIFIED]: { label: 'Qualified', variant: 'default' },
    [LeadStatus.PROPOSAL]: { label: 'Proposal', variant: 'secondary' },
    [LeadStatus.NEGOTIATION]: { label: 'Negotiation', variant: 'outline' },
    [LeadStatus.CLOSED_WON]: { label: 'Closed Won', variant: 'default' },
    [LeadStatus.CLOSED_LOST]: { label: 'Closed Lost', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const priorityConfig: Record<string, BadgeConfig> = {
    [LeadPriority.LOW]: { label: 'Low', variant: 'secondary' },
    [LeadPriority.MEDIUM]: { label: 'Medium', variant: 'default' },
    [LeadPriority.HIGH]: { label: 'High', variant: 'outline' },
    [LeadPriority.URGENT]: { label: 'Urgent', variant: 'destructive' },
  };

  const config = priorityConfig[priority] || { label: priority, variant: 'secondary' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getSourceBadge = (source: string) => {
  const sourceConfig: Record<string, BadgeConfig> = {
    [LeadSource.WEBSITE]: { label: 'Website', variant: 'default' },
    [LeadSource.REFERRAL]: { label: 'Referral', variant: 'secondary' },
    [LeadSource.SOCIAL_MEDIA]: { label: 'Social Media', variant: 'outline' },
    [LeadSource.EMAIL]: { label: 'Email', variant: 'secondary' },
    [LeadSource.PHONE]: { label: 'Phone', variant: 'outline' },
    [LeadSource.OTHER]: { label: 'Other', variant: 'secondary' },
  };

  const config = sourceConfig[source] || { label: source, variant: 'secondary' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const LeadIdClient = () => {
  const leadId = useLeadId();
  const workspaceId = useWorkspaceId();
  const { data: lead, isLoading } = useGetLead({ leadId });
  const { open: openEditLeadModal } = useEditLeadModal();
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  if (isLoading) return <PageLoader />;

  if (!lead) return <PageError message="Lead not found." />;

  return (
    <div className="flex flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspaces/${workspaceId}/leads`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src="" alt={lead.name} />
              <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">{lead.company || 'No company'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCommentsModalOpen(true)}>
            <FileText className="mr-2 size-4" />
            Comments ({lead.comments.length})
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditLeadModal(lead.id)}>
            <Edit className="mr-2 size-4" />
            Edit Lead
          </Button>
        </div>
      </div>

      {/* Status, Priority, Source */}
      <div className="flex flex-wrap items-center gap-3">
        {getStatusBadge(lead.status)}
        {getPriorityBadge(lead.priority)}
        {getSourceBadge(lead.source)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Lead contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                {lead.email}
              </a>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-sm">{lead.company}</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-3">
                <Globe className="size-4 text-muted-foreground" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex items-center gap-1">
                  {lead.website}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment & Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment & Details</CardTitle>
            <CardDescription>Lead assignment and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Assignees</p>
                {lead.assignees && lead.assignees.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.assignees.map((assignee) => (
                      <MemberAvatar key={assignee.$id} name={assignee.name} className="size-6" />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(lead.updatedAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {lead.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {lead.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments Modal */}
      <LeadCommentsModal
        lead={lead}
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
      />
    </div>
  );
};

