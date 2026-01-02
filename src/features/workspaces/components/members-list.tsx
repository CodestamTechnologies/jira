'use client';

import { ArrowLeft, MoreVertical, Shield, UserX, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeleteMember } from '@/features/members/api/use-delete-member';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useUpdateMember } from '@/features/members/api/use-update-member';
import { useUpdateMemberStatus } from '@/features/members/api/use-update-member-status';
import { useUpdateLeadsAccess } from '@/features/members/api/use-update-leads-access';
import { useUpdateInvoicesAccess } from '@/features/members/api/use-update-invoices-access';
import { useUpdateExpensesAccess } from '@/features/members/api/use-update-expenses-access';
import { useUpdateActivityLogsAccess } from '@/features/members/api/use-update-activity-logs-access';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { MemberRole } from '@/features/members/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrent } from '@/features/auth/api/use-current';
import { useConfirm } from '@/hooks/use-confirm';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';

export const MembersList = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const [ConfirmDialog, confirm] = useConfirm('Remove member', 'This member will be removed from this workspace.', 'destructive');
  const [showInactive, setShowInactive] = useState(false);

  // Always fetch all members (including inactive) to know the count and be able to show/hide them
  const { data: allMembers } = useGetMembers({ workspaceId, includeInactive: 'true' });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();
  const { mutate: updateMemberStatus, isPending: isUpdatingStatus } = useUpdateMemberStatus();
  const { mutate: updateLeadsAccess, isPending: isUpdatingLeadsAccess } = useUpdateLeadsAccess();
  const { mutate: updateInvoicesAccess, isPending: isUpdatingInvoicesAccess } = useUpdateInvoicesAccess();
  const { mutate: updateExpensesAccess, isPending: isUpdatingExpensesAccess } = useUpdateExpensesAccess();
  const { mutate: updateActivityLogsAccess, isPending: isUpdatingActivityLogsAccess } = useUpdateActivityLogsAccess();

  const handleDeleteMember = async (memberId: string) => {
    const ok = await confirm();

    if (!ok) return;

    deleteMember(
      { param: { memberId } },
      {
        onSuccess: () => {
          window.location.reload();
        },
      },
    );
  };

  const handleUpdateMember = (memberId: string, role: MemberRole) => {
    updateMember({
      json: { role },
      param: { memberId },
    });
  };

  const handleToggleMemberStatus = (memberId: string, currentStatus: boolean) => {
    updateMemberStatus({
      json: { isActive: !currentStatus },
      param: { memberId },
    });
  };

  const isPending = 
    isDeletingMember || 
    isUpdatingMember || 
    isUpdatingStatus || 
    isUpdatingLeadsAccess || 
    isUpdatingInvoicesAccess || 
    isUpdatingExpensesAccess || 
    isUpdatingActivityLogsAccess || 
    allMembers?.documents.length === 1;

  // Feature access toggle handlers - following DRY principle
  const handleToggleLeadsAccess = (memberId: string, currentAccess: boolean) => {
    updateLeadsAccess({
      param: { memberId },
      json: { hasLeadsAccess: !currentAccess },
    });
  };

  const handleToggleInvoicesAccess = (memberId: string, currentAccess: boolean) => {
    updateInvoicesAccess({
      param: { memberId },
      json: { hasInvoicesAccess: !currentAccess },
    });
  };

  const handleToggleExpensesAccess = (memberId: string, currentAccess: boolean) => {
    updateExpensesAccess({
      param: { memberId },
      json: { hasExpensesAccess: !currentAccess },
    });
  };

  const handleToggleActivityLogsAccess = (memberId: string, currentAccess: boolean) => {
    updateActivityLogsAccess({
      param: { memberId },
      json: { hasActivityLogsAccess: !currentAccess },
    });
  };

  // Separate active and inactive members for display
  const activeMembers = allMembers?.documents.filter(m => m.isActive !== false) || [];
  const inactiveMembers = allMembers?.documents.filter(m => m.isActive === false) || [];

  // Use all members for total count
  const members = allMembers;

  return (
    <Card className="size-full border-none shadow-none">
      <ConfirmDialog />

      <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>

        <CardTitle className="text-xl font-bold">Members list</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        {/* Admin Summary */}
        {members?.documents && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-muted-foreground">
                  Active: {activeMembers.length}
                </span>
                {inactiveMembers.length > 0 && (
                  <span className="text-muted-foreground">
                    Inactive: {inactiveMembers.length}
                  </span>
                )}
                <span className="text-muted-foreground">
                  Admins: {members.documents.filter(m => m.role === 'ADMIN').length}
                </span>
              </div>
              {inactiveMembers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInactive(!showInactive)}
                  className="text-xs"
                >
                  {showInactive ? 'Hide' : 'Show'} Inactive
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active Members */}
        {activeMembers.map((member, i) => (
          <Fragment key={member.$id}>
            <div className="flex items-center gap-2">
              <MemberAvatar name={member.name} className="size-10" fallbackClassName="text-lg" />

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  {member.role === 'ADMIN' && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {member.email === user?.email && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger disabled={isPending} asChild>
                  <Button title="View options" className="ml-auto" variant="secondary" size="icon">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end">
                  {isAdmin && !isAdminLoading && (
                    <>
                      <DropdownMenuItem
                        className="font-medium"
                        asChild
                      >
                        <Link href={`/workspaces/${workspaceId}/members/${member.userId}`}>
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                      >
                        <Link href={`/workspaces/${workspaceId}/members/${member.userId}/attendance`}>
                          View Attendance
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAdmin && (
                    <DropdownMenuItem
                      className="font-medium"
                      asChild
                    >
                      <Link href={`/workspaces/${workspaceId}/members/${member.userId}`}>
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="font-medium"
                    onClick={() => handleUpdateMember(member.$id, MemberRole.ADMIN)}
                    disabled={isPending}
                  >
                    Set as Administrator
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="font-medium"
                    onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)}
                    disabled={isPending}
                  >
                    Set as Member
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {isAdmin && !isAdminLoading && (
                    <>
                      {/* Feature Access Controls */}
                      <DropdownMenuItem
                        className="font-medium"
                        onClick={() => handleToggleLeadsAccess(member.$id, member.hasLeadsAccess || false)}
                        disabled={isPending}
                      >
                        {member.hasLeadsAccess ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Revoke Leads Access
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Grant Leads Access
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="font-medium"
                        onClick={() => handleToggleInvoicesAccess(member.$id, member.hasInvoicesAccess || false)}
                        disabled={isPending}
                      >
                        {member.hasInvoicesAccess ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Revoke Invoices Access
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Grant Invoices Access
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="font-medium"
                        onClick={() => handleToggleExpensesAccess(member.$id, member.hasExpensesAccess || false)}
                        disabled={isPending}
                      >
                        {member.hasExpensesAccess ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Revoke Expenses Access
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Grant Expenses Access
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="font-medium"
                        onClick={() => handleToggleActivityLogsAccess(member.$id, member.hasActivityLogsAccess || false)}
                        disabled={isPending}
                      >
                        {member.hasActivityLogsAccess ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Revoke Activity Logs Access
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Grant Activity Logs Access
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="font-medium text-orange-600"
                        onClick={() => handleToggleMemberStatus(member.$id, member.isActive !== false)}
                        disabled={isPending}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Mark as Inactive
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem
                    className="font-medium text-destructive"
                    onClick={() => handleDeleteMember(member.$id)}
                    disabled={isPending}
                  >
                    Remove {member.name}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {i < activeMembers.length - 1 && <Separator className="my-2.5" />}
          </Fragment>
        ))}

        {/* Inactive Members Section */}
        {showInactive && inactiveMembers.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="mb-2">
              <p className="text-sm font-semibold text-muted-foreground">Inactive Members</p>
            </div>
            {inactiveMembers.map((member, i) => (
              <Fragment key={member.$id}>
                <div className="flex items-center gap-2 opacity-60">
                  <MemberAvatar name={member.name} className="size-10" fallbackClassName="text-lg" />

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                        <UserX className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                      {member.role === 'ADMIN' && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>

                  {isAdmin && !isAdminLoading && (
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={isPending} asChild>
                        <Button title="View options" className="ml-auto" variant="secondary" size="icon">
                          <MoreVertical className="size-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent side="bottom" align="end">
                        <DropdownMenuItem
                          className="font-medium"
                          asChild
                        >
                          <Link href={`/workspaces/${workspaceId}/members/${member.userId}`}>
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="font-medium text-green-600"
                          onClick={() => handleToggleMemberStatus(member.$id, false)}
                          disabled={isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Mark as Active
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {i < inactiveMembers.length - 1 && <Separator className="my-2.5" />}
              </Fragment>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
