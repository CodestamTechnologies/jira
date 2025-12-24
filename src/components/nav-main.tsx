/**
 * Main navigation component for sidebar
 * Displays primary navigation items and quick actions
 * 
 * Features:
 * - Quick Create button for task creation
 * - Inbox button (hidden when sidebar is collapsed)
 * - Main navigation items with active state highlighting
 */
"use client"

import { IconCirclePlusFilled } from "@tabler/icons-react"
import { Mail } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useWorkspaceRoute } from "@/hooks/use-workspace-route"
import { cn } from "@/lib/utils"
import { NavItem } from "@/components/sidebar/nav-item"
import { type NavItem as NavItemType } from "@/components/sidebar/types"
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal"

interface NavMainProps {
  /** Array of main navigation items */
  items: NavItemType[]
}

/**
 * Main navigation section of the sidebar
 * Includes quick actions and primary navigation links
 */
export function NavMain({ items }: NavMainProps) {
  const { buildUrl, isActive, workspaceId } = useWorkspaceRoute()
  const { state } = useSidebar()
  const { open: openCreateTaskModal } = useCreateTaskModal()

  // Early return if no workspace is selected
  if (!workspaceId) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1.5">
        {/* Quick Actions Section */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1.5">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={() => openCreateTaskModal()}
            >
              <IconCirclePlusFilled className="size-4" />
              <span>Quick Create</span>
            </SidebarMenuButton>
            {/* Inbox button - hidden when sidebar is collapsed */}
            <SidebarMenuButton
              tooltip="Inbox"
              className={cn(
                "h-8 w-8 shrink-0 p-0 justify-center transition-opacity",
                state === "collapsed" ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              variant="outline"
              asChild
            >
              <Link href={buildUrl("")}>
                <Mail className="size-4" />
                <span className="sr-only">Inbox</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Main Navigation Items */}
        <SidebarMenu>
          {items.map((item) => (
            <NavItem
              key={item.title}
              item={item}
              href={buildUrl(item.url)}
              isActive={isActive(item.url)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
