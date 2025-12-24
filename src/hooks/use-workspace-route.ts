/**
 * Custom hook for workspace routing utilities
 * Provides reusable functions for building workspace URLs and checking active routes
 * 
 * @example
 * const { buildUrl, isActive } = useWorkspaceRoute()
 * const url = buildUrl('/tasks')
 * const active = isActive('/tasks')
 */
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"

interface UseWorkspaceRouteReturn {
  /** Builds a full workspace URL from a relative path */
  buildUrl: (path: string) => string
  /** Checks if a route is currently active */
  isActive: (path: string) => boolean
  /** Current workspace ID */
  workspaceId: string | null
}

export function useWorkspaceRoute(): UseWorkspaceRouteReturn {
  const workspaceId = useWorkspaceId()
  const pathname = usePathname()

  const buildUrl = useMemo(
    () => (path: string) => {
      if (!workspaceId) return "#"
      return `/workspaces/${workspaceId}${path}`
    },
    [workspaceId]
  )

  const isActive = useMemo(
    () => (path: string) => {
      if (!workspaceId) return false
      
      const fullPath = buildUrl(path)
      
      // Handle root path (empty string)
      if (path === "") {
        return pathname === fullPath || pathname === `/workspaces/${workspaceId}`
      }
      
      // Check exact match or if pathname starts with the route
      return pathname === fullPath || pathname.startsWith(`${fullPath}/`)
    },
    [workspaceId, pathname, buildUrl]
  )

  return {
    buildUrl,
    isActive,
    workspaceId,
  }
}

