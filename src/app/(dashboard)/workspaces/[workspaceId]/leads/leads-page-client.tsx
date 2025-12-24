"use client"

import { AddLeadModal } from "@/components/add-lead-modal"
import { UploadLeadsExcelModal } from "@/components/upload-leads-excel-modal"
import { LeadsStats } from "@/components/leads-stats"
import { LeadsTable } from "@/components/leads-table"
import { EditLeadModal } from "@/features/leads/components/edit-lead-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GalleryVerticalEnd } from "lucide-react"

export function LeadsPageClient() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-5" />
              </div>
              <h1 className="text-xl md:text-3xl font-bold">Leads Management</h1>
            </div>
            <div className="flex items-center gap-2">
              <UploadLeadsExcelModal />
              <AddLeadModal />
            </div>
          </div>

          {/* Dynamic Stats */}
          <LeadsStats />

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Leads</CardTitle>
              <CardDescription>
                Manage and track your sales leads with real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsTable />
            </CardContent>
          </Card>
        </div>
      </div>
      <EditLeadModal />
    </>
  )
}
