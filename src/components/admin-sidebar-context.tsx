'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type AdminSection = 'projects' | 'leads' | null

interface AdminSidebarContextType {
  activeAdminSection: AdminSection
  setActiveAdminSection: (section: AdminSection) => void
  isAdminSheetOpen: boolean
  setIsAdminSheetOpen: (open: boolean) => void
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined)

export const AdminSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>(null)
  const [isAdminSheetOpen, setIsAdminSheetOpen] = useState(false)

  return (
    <AdminSidebarContext.Provider
      value={{
        activeAdminSection,
        setActiveAdminSection,
        isAdminSheetOpen,
        setIsAdminSheetOpen,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  )
}

export const useAdminSidebar = () => {
  const context = useContext(AdminSidebarContext)
  if (context === undefined) {
    throw new Error('useAdminSidebar must be used within an AdminSidebarProvider')
  }
  return context
}
