'use client'

import { useAdminSidebar } from '@/components/admin-sidebar-context'
import { useGetProjects } from '@/features/projects/api/use-get-projects'
import { ProjectAvatar } from '@/features/projects/components/project-avatar'
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { useGetLeads } from '@/features/leads/api/use-get-leads'
import { DottedSeparator } from './dotted-separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { RiAddCircleFill } from 'react-icons/ri'

export const AdminSheet = () => {
  const { activeAdminSection, setActiveAdminSection, setIsAdminSheetOpen, isAdminSheetOpen } = useAdminSidebar()
  const workspaceId = useWorkspaceId()

  const handleClose = () => {
    setActiveAdminSection(null)
    setIsAdminSheetOpen(false)
  }

  return (
    <div
      className={`fixed inset-0 z-[300]  transition-opacity duration-300 ${isAdminSheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      onClick={handleClose}
    >
      <div
        className={`fixed top-0 bottom-0 w-full max-w-[400px] md:w-[400px] bg-card border-r border-border shadow-lg transition-transform duration-300 ease-in-out z-[350] left-0 md:left-[264px] ${isAdminSheetOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold capitalize">{activeAdminSection}</h2>
              <button
                onClick={handleClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-1 hover:bg-accent"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Content based on active section */}
            {activeAdminSection === 'projects' && <ProjectsList onClose={handleClose} />}
            {activeAdminSection === 'leads' && <LeadsList onClose={handleClose} />}
          </div>
        </div>
      </div>
    </div>
  )
}

const ProjectsList = ({ onClose }: { onClose: () => void }) => {
  const workspaceId = useWorkspaceId()
  const { open } = useCreateProjectModal()
  const { data: projects } = useGetProjects({
    workspaceId,
  })

  const handleProjectClick = () => {
    onClose() // Close the sheet when navigating to a project
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Projects</p>
        <button
          onClick={open}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="Add new project"
        >
          <RiAddCircleFill className="size-5 text-muted-foreground transition hover:text-foreground" />
        </button>
      </div>

      {projects?.documents && projects.documents.length > 0 ? (
        <div className="flex flex-col gap-y-1.5">
          {projects.documents.map((project) => {
            const href = `/workspaces/${workspaceId}/projects/${project.$id}`

            return (
              <Link href={href} key={project.$id} onClick={handleProjectClick}>
                <div className="flex cursor-pointer items-center gap-3 rounded-md p-2.5 transition text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ProjectAvatar image={project.imageUrl} name={project.name} />
                  <span className="truncate text-sm font-medium">{project.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No projects found
        </div>
      )}
    </div>
  )
}

const LeadsList = ({ onClose }: { onClose: () => void }) => {
  const workspaceId = useWorkspaceId()
  const { data: leadsData } = useGetLeads({ workspaceId })
  const leads = leadsData?.documents || [] // Show all leads for scrolling

  const handleLeadClick = () => {
    onClose() // Close the sheet when navigating to leads page
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Leads</p>
      </div>

      {leads.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No leads found
        </div>
      ) : (
        <div className="flex flex-col gap-y-1.5 flex-1 min-h-0">
          {leads.map((lead) => {
            const href = `/workspaces/${workspaceId}/leads/${lead.id}`

            return (
              <Link href={href} key={lead.id} onClick={handleLeadClick}>
                <div className="flex cursor-pointer items-center gap-3 rounded-md p-2.5 transition text-muted-foreground hover:text-foreground hover:bg-accent">
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold shrink-0">
                    {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{lead.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{lead.company || lead.email || 'No contact info'}</div>
                  </div>
                </div>
              </Link>
            )
          })}

          <Link href={`/workspaces/${workspaceId}/leads`} onClick={handleLeadClick} className="mt-4">
            <div className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer p-2.5 rounded-md hover:bg-accent text-center border border-border">
              View all leads →
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
