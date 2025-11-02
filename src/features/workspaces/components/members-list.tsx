'use client';

import { ArrowLeft, MoreVertical, Shield } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useDeleteMember } from '@/features/members/api/use-delete-member';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useUpdateMember } from '@/features/members/api/use-update-member';
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



  const { data: members } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

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

  const isPending = isDeletingMember || isUpdatingMember || members?.documents.length === 1;

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
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        {/* Admin Summary */}
        {members?.documents && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total Members: {members.documents.length}
              </span>
              <span className="text-muted-foreground">
                Admins: {members.documents.filter(m => m.role === 'ADMIN').length}
              </span>
            </div>
          </div>
        )}

        {members?.documents.map((member, i) => (
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

                  <DropdownMenuItem
                    className="font-medium text-warning"
                    onClick={() => handleDeleteMember(member.$id)}
                    disabled={isPending}
                  >
                    Remove {member.name}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {i < members.documents.length - 1 && <Separator className="my-2.5" />}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
};
