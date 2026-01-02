import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { DownloadsButton } from "@/components/downloads-button"
import { CheckInButton } from "@/components/check-in-button"

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center border-b transition-[width,height] ease-linear sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8" />
          <Separator
            orientation="vertical"
            className="h-4"
          />
        </div>
        <div className="flex items-center gap-1">
          <CheckInButton />
          <DownloadsButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
