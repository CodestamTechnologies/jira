/**
 * Shared types for sidebar navigation components
 * Ensures type consistency across all nav components
 */
import { type ComponentType } from "react"

/**
 * Base navigation item structure
 */
export interface NavItem {
  /** Display title/label */
  title: string
  /** Relative URL path (will be prefixed with workspace ID) */
  url: string
  /** Icon component to display */
  icon?: ComponentType<{ className?: string }>
}

/**
 * Navigation item with additional metadata
 */
export interface NavItemWithMetadata extends NavItem {
  /** Optional description or tooltip */
  description?: string
  /** Whether this item requires admin privileges */
  requiresAdmin?: boolean
}

