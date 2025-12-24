'use client';

import { Loader2, LogOut, User } from 'lucide-react';
import { useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCurrent } from '@/features/auth/api/use-current';
import { useLogout } from '@/features/auth/api/use-logout';
import { EditProfileDialog } from '@/features/auth/components/edit-profile-dialog';

export const UserButton = () => {
  const { data: user, isLoading } = useCurrent();
  const { mutate: logout, isPending } = useLogout();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border border-muted bg-muted">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const { name, email, imageUrl } = user;

  const avatarFallback = name ? name.charAt(0).toUpperCase() : (email?.charAt(0).toUpperCase() ?? '?');

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger disabled={isPending} className="relative rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Avatar className="size-10 border border-muted transition hover:opacity-75">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt={name || 'User'} />
            ) : null}
            <AvatarFallback className="flex items-center justify-center bg-muted font-medium text-muted-foreground">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={10}>
          <div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
            <Avatar className="size-[52px] border border-muted">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name || 'User'} />
              ) : null}
              <AvatarFallback className="flex items-center justify-center bg-muted text-xl font-medium text-muted-foreground">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <Separator className="mb-1" />

          <DropdownMenuItem
            disabled={isPending}
            onClick={() => setIsEditDialogOpen(true)}
            className="flex h-10 cursor-pointer items-center justify-center"
          >
            <User className="mr-2 size-4" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isPending}
            onClick={() => logout()}
            className="flex h-10 cursor-pointer items-center justify-center font-medium text-warning"
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
};
