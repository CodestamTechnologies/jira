/**
 * Admin navigation component for sidebar
 * Displays admin-only navigation items and actions
 * Only visible to users with admin privileges
 * 
 * Features:
 * - Projects and Leads management (opens admin sheet)
 * - Admin-only routes (Team Attendance, Invoices, Activity Log)
 */
"use client"

import { Clock, FileText, History, Folder, Users, Settings, Receipt } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useWorkspaceRoute } from "@/hooks/use-workspace-route"
import { useAdminSidebar } from "@/components/admin-sidebar-context"
import { useAdminStatus } from "@/features/attendance/hooks/use-admin-status"
import { NavItem } from "@/components/sidebar/nav-item"
import { useHasLeadsAccess } from '@/features/members/hooks/use-feature-access'

/**
 * Admin-only navigation routes
 * These routes are only accessible to workspace admins
 */
const ADMIN_ROUTES = [
  {
    title: "Team Attendance",
    url: "/attendance/team",
    icon: Clock,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Activity Log",
    url: "/activity",
    icon: History,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
] as const

/**
 * Admin navigation section
 * Conditionally renders based on user's admin status
 */
export function NavAdmin() {
  const { buildUrl, isActive, workspaceId } = useWorkspaceRoute()
  const pathname = usePathname()
  const { data: isAdmin, isLoading } = useAdminStatus()
  const { data: hasLeadsAccess, isLoading: isLoadingLeadsAccess } = useHasLeadsAccess()
  const { activeAdminSection, setActiveAdminSection, setIsAdminSheetOpen } = useAdminSidebar()

  // Don't render anything if not admin or still loading
  if (isLoading || !isAdmin || !workspaceId) {
    return null
  }

  /**
   * Handles admin section toggle (Projects/Leads)
   * Opens/closes the admin sheet sidebar
   */
  const handleAdminSectionToggle = (section: "projects" | "leads") => {
    const newSection = activeAdminSection === section ? null : section
    setActiveAdminSection(newSection)
    setIsAdminSheetOpen(newSection !== null)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Projects Management - Opens admin sheet */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Projects"
              isActive={activeAdminSection === "projects"}
              onClick={() => handleAdminSectionToggle("projects")}
            >
              <Folder />
              <span>Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Leads Management - Opens admin sheet - Only show if user has access */}
          {!isLoadingLeadsAccess && hasLeadsAccess && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Leads"
                isActive={activeAdminSection === "leads"}
                onClick={() => handleAdminSectionToggle("leads")}
              >
                <Users />
                <span>Leads</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Admin-only routes */}
          {ADMIN_ROUTES.map((route) => (
            <NavItem
              key={route.title}
              item={route}
              href={buildUrl(route.url)}
              isActive={isActive(route.url)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
