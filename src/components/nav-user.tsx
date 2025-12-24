/**
 * User profile navigation component for sidebar footer
 * Displays user information and account actions
 * 
 * Features:
 * - User avatar and information display
 * - Account management dropdown
 * - Profile editing dialog
 * - Logout functionality
 */
"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
} from "@tabler/icons-react"
import { CreditCard, LogOut, User } from "lucide-react"
import { useState, useMemo } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useCurrent } from "@/features/auth/api/use-current"
import { useLogout } from "@/features/auth/api/use-logout"
import { EditProfileDialog } from "@/features/auth/components/edit-profile-dialog"

/**
 * User profile component in sidebar footer
 * Handles user authentication state and profile management
 */
export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: user, isLoading } = useCurrent()
  const { mutate: logout, isPending } = useLogout()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Memoize avatar fallback to avoid recalculation
  const avatarFallback = useMemo(() => {
    if (!user) return "?"
    const { name, email } = user
    return name ? name.charAt(0).toUpperCase() : (email?.charAt(0).toUpperCase() ?? "?")
  }, [user])

  // Don't render if loading or no user
  if (isLoading || !user) {
    return null
  }

  const { name, email, imageUrl } = user

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  {imageUrl && <AvatarImage src={imageUrl} alt={name || "User"} />}
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {email}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              {/* User Info Header */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {imageUrl && <AvatarImage src={imageUrl} alt={name || "User"} />}
                    <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Account Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <User className="size-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isPending}>
                  <CreditCard className="size-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isPending}>
                  <IconNotification className="size-4" />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              {/* Logout Action */}
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => logout()}
                className="text-warning"
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Profile Edit Dialog */}
      <EditProfileDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  )
}
