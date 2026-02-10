/**
 * Main application sidebar component
 * Orchestrates all sidebar navigation sections
 * 
 * Structure:
 * - Header: Logo and Workspace Switcher
 * - Content: Main nav, Admin nav (conditional)
 * - Footer: User profile and actions
 * 
 * @see https://ui.shadcn.com/docs/components/sidebar for component API
 */
"use client"

import * as React from "react"
import { Suspense, useMemo } from "react"
import {
  Clock,
  TrendingUp,
  Users as UsersIcon,
  Settings,
} from "lucide-react"
import { GoHome, GoCheckCircle } from "react-icons/go"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { NavAdmin } from "@/components/nav-admin"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { WorkspaceSwitcher } from "@/components/workspaces-switcher"
import { type NavItem } from "@/components/sidebar/types"
import { useHasLeadsAccess } from '@/features/members/hooks/use-feature-access'

/**
 * Main navigation items configuration
 * These appear in the primary navigation section
 */
const NAV_MAIN_ITEMS: NavItem[] = [
  {
    title: "Home",
    url: "",
    icon: GoHome,
  },
  {
    title: "My Tasks",
    url: "/tasks",
    icon: GoCheckCircle,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: TrendingUp,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Clock,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Clock,
  },
  {
    title: "Members",
    url: "/members",
    icon: UsersIcon,
  },
] as const


interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }

/**
 * Application sidebar component
 * Main entry point for sidebar navigation
 * 
 * Features:
 * - Collapsible sidebar with offcanvas mode
 * - Workspace-aware routing
 * - Conditional admin section
 * - User profile management
 */
export function AppSidebar({ ...props }: AppSidebarProps) {
  const { data: hasLeadsAccess, isLoading: isLoadingLeadsAccess } = useHasLeadsAccess()

  // Filter navigation items based on access
  const filteredNavItems = useMemo(() => {
    return NAV_MAIN_ITEMS.filter((item) => {
      // Show Leads only if user has access
      if (item.title === "Leads") {
        return hasLeadsAccess === true
      }
      return true
    })
  }, [hasLeadsAccess])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Sidebar Header - Logo and Workspace Switcher */}
      <SidebarHeader className="gap-2 border-b pb-2">
        <div className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 data-[slot=sidebar-menu-button]:!h-auto data-[slot=sidebar-menu-button]:!w-full data-[slot=sidebar-menu-button]:!justify-start"
              >
                <Logo />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        {/* Workspace switcher wrapped in Suspense for async loading */}
        <div className="px-2">
          <Suspense fallback={null}>
            <WorkspaceSwitcher />
          </Suspense>
        </div>
      </SidebarHeader>

      {/* Sidebar Content - Navigation Sections */}
      <SidebarContent>
        {!isLoadingLeadsAccess && <NavMain items={filteredNavItems} />}
        <NavAdmin />
      </SidebarContent>

      {/* Sidebar Footer - User Profile */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
