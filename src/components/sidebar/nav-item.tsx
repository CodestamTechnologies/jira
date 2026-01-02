/**
 * Reusable navigation item component
 * Implements DRY principle by centralizing nav item rendering logic
 * 
 * @example
 * <NavItem
 *   item={{ title: "Home", url: "", icon: HomeIcon }}
 *   isActive={true}
 * />
 */
"use client"

import Link from "next/link"
import { type ComponentType } from "react"

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { type NavItem } from "./types"

interface NavItemProps {
  /** Navigation item data */
  item: NavItem
  /** Full URL to navigate to */
  href: string
  /** Whether this item is currently active */
  isActive: boolean
}

/**
 * Single navigation item component
 * Handles rendering of individual sidebar menu items with consistent styling
 */
export function NavItem({ item, href, isActive }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
        <Link href={href}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}






