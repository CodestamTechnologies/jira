import 'server-only'

import { Databases, Query } from 'node-appwrite'
import { DATABASE_ID, MEMBERS_ID, TASKS_ID, ATTENDANCE_ID, WORKSPACES_ID, LEADS_ID, COMMENTS_ID, ACTIVITY_LOGS_ID, PROJECTS_ID } from '@/config/db'
import { ActivityEntityType, ActivityAction, type ActivityLog } from '@/features/activity-logs/types'
import { parseActivityChanges } from '@/features/activity-logs/utils/log-activity'
import { createAdminClient } from '@/lib/appwrite'
import { sendEmailWithDefaults } from '@/lib/email/email-service'
import { TaskStatus } from '@/features/tasks/types'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface SendReportsToEmailsInput {
  emails: string[]
  date?: string
}

export interface SendReportsResult {
  success: boolean
  error?: string
  emailIds?: string[]
}

/**
 * Send daily reports to multiple emails
 */
export async function sendDailyReportsToEmails(input: SendReportsToEmailsInput): Promise<SendReportsResult> {
  try {
    console.log('API called with:', input)
    console.log('RESEND_API_KEY available:', !!process.env.RESEND_API_KEY)

    const { databases } = await createAdminClient()

    // Determine the date to fetch reports for
    const targetDate = input.date || new Date().toISOString().split('T')[0]

    // Fetch all workspaces
    const workspacesResponse = await databases.listDocuments(
      DATABASE_ID,
      WORKSPACES_ID,
      [Query.limit(100)] // Get all workspaces
    )

    console.log(`Found ${workspacesResponse.documents.length} workspaces`)

    const allTasks: any[] = []
    const allAttendance: any[] = []
    const allLeads: any[] = []
    const allMembersMap = new Map()
    const allProjectsMap = new Map() // Map to store projects by ID

    // Fetch data from all workspaces
    for (const workspace of workspacesResponse.documents) {
      console.log(`Processing workspace: ${workspace.name}`)

      // Fetch ALL tasks for this workspace first, then filter by today's date
      const allTasksResponse = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal('workspaceId', workspace.$id),
          Query.limit(1000), // Get more tasks to filter from
        ]
      )

      // Filter tasks created or updated today
      const tasksResponse = {
        ...allTasksResponse,
        documents: allTasksResponse.documents.filter(task => {
          const createdDate = task.$createdAt ? task.$createdAt.split('T')[0] : null
          const updatedDate = task.$updatedAt ? task.$updatedAt.split('T')[0] : null
          return createdDate === targetDate || updatedDate === targetDate
        })
      }

      // Fetch attendance for this workspace and date
      const attendanceResponse = await databases.listDocuments(
        DATABASE_ID,
        ATTENDANCE_ID,
        [
          Query.equal('workspaceId', workspace.$id),
          Query.equal('date', targetDate),
        ]
      )

      // Fetch ALL leads for this workspace first, then filter by today's date
      const allLeadsResponse = await databases.listDocuments(
        DATABASE_ID,
        LEADS_ID,
        [
          Query.equal('workspaceId', workspace.$id),
          Query.limit(1000), // Get more leads to filter from
        ]
      )

      // Filter leads created today
      const leadsResponse = {
        ...allLeadsResponse,
        documents: allLeadsResponse.documents.filter(lead => {
          const createdDate = lead.$createdAt ? lead.$createdAt.split('T')[0] : null
          return createdDate === targetDate
        })
      }

      console.log(`Workspace ${workspace.name}: ${tasksResponse.documents.length} tasks, ${attendanceResponse.documents.length} attendance, ${leadsResponse.documents.length} leads`)

      // Add workspace info to tasks, attendance, and leads
      tasksResponse.documents.forEach(task => {
        allTasks.push({ ...task, workspaceName: workspace.name, workspaceId: workspace.$id })
      })

      attendanceResponse.documents.forEach(att => {
        allAttendance.push({ ...att, workspaceName: workspace.name, workspaceId: workspace.$id })
      })

      leadsResponse.documents.forEach(lead => {
        allLeads.push({ ...lead, workspaceName: workspace.name, workspaceId: workspace.$id })
      })

      // Fetch ALL projects for this workspace
      const projectsResponse = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_ID,
        [Query.equal('workspaceId', workspace.$id)]
      )

      // Store projects in map
      projectsResponse.documents.forEach(project => {
        allProjectsMap.set(project.$id, project)
      })

      console.log(`Workspace ${workspace.name}: Found ${projectsResponse.documents.length} projects`)

      // Fetch ALL members for this workspace (not just referenced ones)
      // This ensures we have complete member data for lookup
      const membersResponse = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal('workspaceId', workspace.$id)]
      )

      if (membersResponse.documents.length > 0) {

        // Fetch user details for each member to get names
        const { users } = await createAdminClient()
        for (const member of membersResponse.documents) {
          try {
            const user = await users.get(member.userId)
            const memberData = {
              ...member,
              workspaceName: workspace.name,
              name: user.name || 'Unknown User',
              email: user.email
            }
            // Store by userId (for attendance lookup)
            allMembersMap.set(`${workspace.$id}-${member.userId}`, memberData)
            // Store by member document ID (for task assignee lookup)
            allMembersMap.set(`${workspace.$id}-${member.$id}`, memberData)
          } catch (error) {
            console.warn(`Could not fetch user ${member.userId}:`, error)
            const memberData = {
              ...member,
              workspaceName: workspace.name,
              name: 'Unknown User'
            }
            // Store by both userId and document ID
            allMembersMap.set(`${workspace.$id}-${member.userId}`, memberData)
            allMembersMap.set(`${workspace.$id}-${member.$id}`, memberData)
          }
        }
      }
    }

    console.log(`Total data collected: ${allTasks.length} tasks, ${allAttendance.length} attendance, ${allLeads.length} leads`)
    console.log(`Total projects in map: ${allProjectsMap.size}`)

    // Debug: Check task projectIds
    const taskProjectIds = new Set(allTasks.map(t => t.projectId).filter(Boolean))
    console.log(`Unique project IDs in tasks: ${taskProjectIds.size}`)
    const missingProjects = Array.from(taskProjectIds).filter(id => !allProjectsMap.has(id))
    if (missingProjects.length > 0) {
      console.warn(`Tasks reference ${missingProjects.length} projects not found in map:`, missingProjects.slice(0, 5))

      // Try to fetch missing projects individually
      console.log('Attempting to fetch missing projects...')
      for (const missingProjectId of missingProjects.slice(0, 20)) { // Limit to 20 to avoid too many requests
        try {
          const missingProject = await databases.getDocument(DATABASE_ID, PROJECTS_ID, missingProjectId)
          if (missingProject) {
            allProjectsMap.set(missingProject.$id, missingProject)
            console.log(`Fetched missing project: ${missingProject.name} (${missingProject.$id})`)
          }
        } catch (error) {
          console.warn(`Could not fetch project ${missingProjectId}:`, error)
        }
      }
    }

    // Log sample of projects in map for debugging
    if (allProjectsMap.size > 0) {
      const sampleProjects = Array.from(allProjectsMap.entries()).slice(0, 3)
      console.log('Sample projects in map:', sampleProjects.map(([id, p]) => ({ id, name: p.name })))
    }

    // Fetch activity logs for today
    console.log('Fetching activity logs and comments...')
    const taskIds = allTasks.map(t => t.$id)
    const attendanceIds = allAttendance.map(a => a.$id)
    const leadIds = allLeads.map(l => l.$id)

    let activityLogs: any[] = []
    let comments: any[] = []

    if (ACTIVITY_LOGS_ID) {
      try {
        // Fetch activity logs for tasks, attendance created/updated today
        const startOfDay = `${targetDate}T00:00:00.000Z`
        const endOfDay = `${targetDate}T23:59:59.999Z`

        // Fetch task activity logs
        if (taskIds.length > 0) {
          const taskLogsResponse = await databases.listDocuments(
            DATABASE_ID,
            ACTIVITY_LOGS_ID,
            [
              Query.greaterThanEqual('$createdAt', startOfDay),
              Query.lessThanEqual('$createdAt', endOfDay),
              Query.equal('entityType', ActivityEntityType.TASK),
              Query.limit(1000)
            ]
          )
          activityLogs.push(...taskLogsResponse.documents.filter((log: any) => taskIds.includes(log.entityId)))
        }

        // Fetch attendance activity logs
        if (attendanceIds.length > 0) {
          const attendanceLogsResponse = await databases.listDocuments(
            DATABASE_ID,
            ACTIVITY_LOGS_ID,
            [
              Query.greaterThanEqual('$createdAt', startOfDay),
              Query.lessThanEqual('$createdAt', endOfDay),
              Query.equal('entityType', ActivityEntityType.ATTENDANCE),
              Query.limit(1000)
            ]
          )
          activityLogs.push(...attendanceLogsResponse.documents.filter((log: any) => attendanceIds.includes(log.entityId)))
        }

        console.log(`Found ${activityLogs.length} activity logs`)
      } catch (error) {
        console.warn('Error fetching activity logs:', error)
      }
    }

    // Fetch comments for tasks in the report
    if (COMMENTS_ID && taskIds.length > 0) {
      try {
        const startOfDay = `${targetDate}T00:00:00.000Z`
        const endOfDay = `${targetDate}T23:59:59.999Z`

        // Fetch comments created today for tasks in our report
        const commentsResponse = await databases.listDocuments(
          DATABASE_ID,
          COMMENTS_ID,
          [
            Query.greaterThanEqual('$createdAt', startOfDay),
            Query.lessThanEqual('$createdAt', endOfDay),
            Query.limit(1000)
          ]
        )

        // Filter to only include comments for tasks in our report
        comments = commentsResponse.documents.filter((comment: any) => {
          return taskIds.includes(comment.taskId)
        })

        console.log(`Found ${comments.length} comments`)
      } catch (error) {
        console.warn('Error fetching comments:', error)
      }
    }

    // Generate PDF report
    console.log('Generating PDF report...')

    const pdfBuffer = generateDailyReportPDF({
      date: targetDate,
      tasks: allTasks,
      attendance: allAttendance,
      leads: allLeads,
      membersMap: allMembersMap,
      projectsMap: allProjectsMap,
      workspaces: workspacesResponse.documents,
      activityLogs,
      comments,
    })

    const pdfBase64 = pdfBuffer.toString('base64')
    console.log('PDF report generated successfully, size:', pdfBase64.length)

    // Send emails with PDF attachment
    console.log('Sending daily reports via email with PDF attachment...')

    const emailResults = await Promise.allSettled(
      input.emails.map(async (email, index) => {
        console.log(`Sending daily report PDF to: ${email}`)
        try {
          const result = await sendEmailWithDefaults({
            from: 'Codestam Technologies <noreply@manyblogs.blog>',
            to: email,
            subject: `Daily Report - All Workspaces - ${formatDate(targetDate)}`,
            text: `Daily Activity Report for ${formatDate(targetDate)} - Tasks: ${allTasks.length}, Attendance: ${allAttendance.length}, Leads: ${allLeads.length}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>Daily Activity Report</h1>
                <p>Please find attached the daily activity report for ${formatDate(targetDate)}.</p>
                <p>This report includes tasks, attendance records, and leads from all workspaces.</p>
                <p><strong>Summary:</strong> ${allTasks.length} tasks, ${allAttendance.length} attendance records, ${allLeads.length} leads</p>
                <br>
                <p>Best regards,<br>Your Workspace Team</p>
              </div>
            `,
            attachments: [{
              filename: `daily-report-${targetDate}.pdf`,
              content: pdfBase64,
            }],
          })
          console.log(`Email with PDF sent successfully to ${email}:`, result.data?.id)
          return result
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error)
          throw error
        }
      })
    )

    const successfulEmails: string[] = []
    const failedEmails: string[] = []

    emailResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successfulEmails.push(result.value.data?.id || `email-${Date.now()}-${index}`)
      } else {
        console.error(`Failed email result for ${input.emails[index]}:`, result)
        failedEmails.push(input.emails[index])
      }
    })

    console.log('Email sending complete:', {
      successful: successfulEmails.length,
      failed: failedEmails.length,
      totalData: `Tasks: ${allTasks.length}, Attendance: ${allAttendance.length}, Leads: ${allLeads.length}`
    })

    if (successfulEmails.length === 0) {
      return {
        success: false,
        error: `Failed to send emails to: ${failedEmails.join(', ')}`,
      }
    }

    return {
      success: true,
      emailIds: successfulEmails,
    }
  } catch (error) {
    console.error('Error sending daily reports emails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}


/**
 * Generate PDF report using jsPDF with improved structure
 */
function generateDailyReportPDF(data: {
  date: string
  tasks: any[]
  attendance: any[]
  leads: any[]
  membersMap: Map<string, any>
  projectsMap: Map<string, any>
  workspaces: any[]
  activityLogs?: any[]
  comments?: any[]
}): Buffer {
  const { date, tasks, attendance, leads, membersMap, projectsMap, workspaces, activityLogs = [], comments = [] } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // Helper function to get status color
  const getStatusColor = (status: string): [number, number, number] => {
    const statusUpper = status.toUpperCase()
    if (statusUpper === 'DONE' || statusUpper === 'COMPLETED') return [39, 174, 96] // Green
    if (statusUpper === 'IN_PROGRESS' || statusUpper === 'IN PROGRESS') return [243, 156, 18] // Orange
    if (statusUpper === 'IN_REVIEW' || statusUpper === 'IN REVIEW') return [52, 152, 219] // Blue
    if (statusUpper === 'BACKLOG') return [155, 89, 182] // Purple
    if (statusUpper === 'PRESENT') return [39, 174, 96] // Green
    if (statusUpper === 'ABSENT') return [231, 76, 60] // Red
    if (statusUpper === 'LATE') return [243, 156, 18] // Orange
    return [149, 165, 166] // Gray for TODO/default
  }

  // Helper function to add company header
  const addCompanyHeader = (yPos: number): number => {
    // Header background
    doc.setFillColor(255, 255, 255) // White background
    doc.rect(margin, yPos, contentWidth, 30, 'F')

    // Add border
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPos, contentWidth, 30, 'S')

    // Add company heading (centered)
    const headingX = pageWidth / 2
    const headingY = yPos + 12
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 62, 80) // Dark blue-gray
    doc.text('Jira Report', headingX, headingY, { align: 'center' })

    // Add subtitle
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(127, 140, 141) // Gray
    doc.text('Daily Activity Report', headingX, headingY + 8, { align: 'center' })

    doc.setTextColor(0, 0, 0)
    return yPos + 35
  }

  // Helper function to add header section
  const addHeader = (yPos: number): number => {
    // Header background
    doc.setFillColor(52, 152, 219) // Blue
    doc.rect(margin, yPos, contentWidth, 25, 'F')

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Daily Activity Report', margin + 5, yPos + 12)

    // Date and summary info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const dateText = formatDate(date)
    const summaryText = `${workspaces.length} Workspace${workspaces.length !== 1 ? 's' : ''} | ${tasks.length} Tasks | ${attendance.length} Attendance | ${leads.length} Leads`
    doc.text(dateText, margin + 5, yPos + 20)
    doc.text(summaryText, pageWidth - margin - 5, yPos + 20, { align: 'right' })

    doc.setTextColor(0, 0, 0)
    return yPos + 30
  }

  // Helper function to add workspace section header
  const addWorkspaceHeader = (workspaceName: string, yPos: number): number => {
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = margin
    }

    // Workspace header background
    doc.setFillColor(236, 240, 241) // Light gray
    doc.rect(margin, yPos, contentWidth, 12, 'F')

    // Workspace name
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 62, 80) // Dark blue-gray
    doc.text(workspaceName, margin + 5, yPos + 8)

    doc.setTextColor(0, 0, 0)
    return yPos + 18
  }

  // Helper function to add section title
  const addSectionTitle = (title: string, count: number, yPos: number): number => {
    if (yPos > pageHeight - 50) {
      doc.addPage()
      yPos = margin
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(52, 73, 94)
    doc.text(`${title} (${count})`, margin + 5, yPos)

    doc.setTextColor(0, 0, 0)
    return yPos + 7
  }

  let yPosition = margin

  // Add company header with logo
  yPosition = addCompanyHeader(yPosition)

  // Add header
  yPosition = addHeader(yPosition)

  // Group data by workspace
  const tasksByWorkspace = new Map()
  const attendanceByWorkspace = new Map()
  const leadsByWorkspace = new Map()

  tasks.forEach(task => {
    if (!tasksByWorkspace.has(task.workspaceId)) {
      tasksByWorkspace.set(task.workspaceId, [])
    }
    tasksByWorkspace.get(task.workspaceId).push(task)
  })

  attendance.forEach(att => {
    if (!attendanceByWorkspace.has(att.workspaceId)) {
      attendanceByWorkspace.set(att.workspaceId, [])
    }
    attendanceByWorkspace.get(att.workspaceId).push(att)
  })

  leads.forEach(lead => {
    if (!leadsByWorkspace.has(lead.workspaceId)) {
      leadsByWorkspace.set(lead.workspaceId, [])
    }
    leadsByWorkspace.get(lead.workspaceId).push(lead)
  })

  // Process each workspace
  workspaces.forEach(workspace => {
    const workspaceTasks = tasksByWorkspace.get(workspace.$id) || []
    const workspaceAttendance = attendanceByWorkspace.get(workspace.$id) || []
    const workspaceLeads = leadsByWorkspace.get(workspace.$id) || []

    // Skip workspace if no data
    if (workspaceTasks.length === 0 && workspaceAttendance.length === 0 && workspaceLeads.length === 0) {
      return
    }

    // Workspace header
    yPosition = addWorkspaceHeader(workspace.name, yPosition)

    // Tasks Table - Group by Project
    if (workspaceTasks.length > 0) {
      // Group tasks by project
      const tasksByProject = new Map()
      workspaceTasks.forEach((task: any) => {
        const projectId = task.projectId || 'no-project'
        if (!tasksByProject.has(projectId)) {
          tasksByProject.set(projectId, [])
        }
        tasksByProject.get(projectId).push(task)
      })

      // Process each project - Skip "No Project" if empty or show it last
      const sortedProjects = Array.from(tasksByProject.entries()).sort((a, b) => {
        // Put "no-project" at the end
        if (a[0] === 'no-project') return 1
        if (b[0] === 'no-project') return -1
        return 0
      })

      sortedProjects.forEach(([projectId, projectTasks]: [string, any[]]) => {
        // Skip "No Project" section if it's empty or has no tasks
        if (projectId === 'no-project' && projectTasks.length === 0) {
          return
        }

        let projectName = 'No Project'

        if (projectId !== 'no-project') {
          const project = projectsMap.get(projectId)
          if (project && project.name) {
            projectName = project.name
          } else {
            // Project ID exists but project not found - might be deleted or missing
            console.warn(`Project with ID ${projectId} not found in projects map. Map size: ${projectsMap.size}`)
            console.warn(`Looking for projectId: ${projectId}`)
            console.warn(`Available project IDs in map:`, Array.from(projectsMap.keys()).slice(0, 5))
            // Don't show the ID, just show "Unknown Project" or try to fetch it
            projectName = 'Unknown Project'
          }
        }

        if (yPosition > pageHeight - 80) {
          doc.addPage()
          yPosition = margin
        }

        // Project header
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(52, 73, 94)
        doc.text(`Project: ${projectName}`, margin + 5, yPosition)
        yPosition += 8

        const taskTableData = projectTasks.map((task: any) => {
          const assignees = task.assigneeIds?.map((id: string) => {
            let member = membersMap.get(`${task.workspaceId}-${id}`)
            if (!member) {
              const entries = Array.from(membersMap.entries())
              for (const [key, value] of entries) {
                if (key.includes(id) || (value as any).$id === id) {
                  member = value
                  break
                }
              }
            }
            return member ? (member.name || member.email || 'Unknown') : 'Unknown'
          }).join(', ') || 'Unassigned'

          const status = task.status || 'TODO'
          const description = task.description ? (task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description) : '-'
          const dueDate = task.dueDate ? formatDate(task.dueDate) : '-'

          return [
            task.name || 'Unnamed Task',
            status,
            assignees,
            description,
            dueDate
          ]
        })

        autoTable(doc, {
          startY: yPosition,
          head: [['Task Name', 'Status', 'Assignees', 'Description', 'Due Date']],
          body: taskTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 40 },
            3: { cellWidth: 40 },
            4: { cellWidth: 30 }
          },
          didParseCell: (data: any) => {
            // Color status cells
            if (data.column.index === 1 && data.row.index > 0) {
              const status = data.cell.text[0]
              const [r, g, b] = getStatusColor(status)
              data.cell.styles.fillColor = [r, g, b]
              data.cell.styles.textColor = [255, 255, 255]
              data.cell.styles.fontStyle = 'bold'
            }
          },
          margin: { left: margin, right: margin }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
        yPosition += 5 // Space between projects
      })
    }

    // Attendance Table
    if (workspaceAttendance.length > 0) {
      yPosition = addSectionTitle('Attendance', workspaceAttendance.length, yPosition)

      const attendanceTableData = workspaceAttendance.map((att: any) => {
        const member = membersMap.get(`${att.workspaceId}-${att.userId}`)
        const memberName = member ? (member.name || member.email || 'Unknown') : 'Unknown'
        const status = att.status.toUpperCase()
        const checkInTime = att.checkInTime ? formatTime(String(att.checkInTime)) : '-'
        const checkOutTime = att.checkOutTime ? formatTime(String(att.checkOutTime)) : '-'
        // Format hours to show maximum 2 decimal places, removing trailing zeros
        const totalHours = att.totalHours ? `${parseFloat(Number(att.totalHours).toFixed(2))}h` : '-'
        const location = att.checkInAddress ? (att.checkInAddress.length > 30 ? att.checkInAddress.substring(0, 30) + '...' : att.checkInAddress) : '-'

        return [
          memberName,
          status,
          checkInTime,
          checkOutTime,
          totalHours,
          location
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Employee', 'Status', 'Check-in', 'Check-out', 'Hours', 'Location']],
        body: attendanceTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 50 }
        },
        didParseCell: (data: any) => {
          // Color status cells
          if (data.column.index === 1 && data.row.index > 0) {
            const status = data.cell.text[0]
            const [r, g, b] = getStatusColor(status)
            data.cell.styles.fillColor = [r, g, b]
            data.cell.styles.textColor = [255, 255, 255]
            data.cell.styles.fontStyle = 'bold'
          }
        },
        margin: { left: margin, right: margin }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Leads Table
    if (workspaceLeads.length > 0) {
      yPosition = addSectionTitle('Leads', workspaceLeads.length, yPosition)

      const leadsTableData = workspaceLeads.map((lead: any) => {
        const assignee = lead.assignedTo ? membersMap.get(`${lead.workspaceId}-${lead.assignedTo}`) : null
        const assigneeName = assignee ? (assignee.name || assignee.email || 'Unassigned') : 'Unassigned'
        const leadName = lead.name || lead.companyName || 'Unnamed Lead'
        const email = lead.email || '-'
        const phone = lead.phone || '-'
        const status = lead.status || 'New'

        return [
          leadName,
          email,
          phone,
          status,
          assigneeName
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Lead Name', 'Email', 'Phone', 'Status', 'Assigned To']],
        body: leadsTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 }
        },
        margin: { left: margin, right: margin }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    yPosition += 5 // Space between workspaces
  })

  // Summary Section
  if (yPosition > pageHeight - 80) {
    doc.addPage()
    yPosition = margin
  }

  // Summary header
  doc.setFillColor(44, 62, 80) // Dark blue-gray
  doc.rect(margin, yPosition, contentWidth, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', margin + 5, yPosition + 10)
  doc.setTextColor(0, 0, 0)
  yPosition += 20

  // Summary boxes - smaller cards with more data
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG).length
  const notPresentMembers = attendance.filter(a => a.status === 'absent').length

  const summaryData = [
    { label: 'Total Tasks', value: tasks.length, color: [52, 152, 219] },
    { label: 'Completed', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: [39, 174, 96] },
    { label: 'In Progress', value: inProgressTasks, color: [243, 156, 18] },
    { label: 'Pending', value: pendingTasks, color: [149, 165, 166] },
    { label: 'Attendance', value: attendance.length, color: [52, 152, 219] },
    { label: 'Present', value: attendance.filter(a => a.status === 'present').length, color: [39, 174, 96] },
    { label: 'Not Present', value: notPresentMembers, color: [231, 76, 60] },
    { label: 'Total Leads', value: leads.length, color: [155, 89, 182] }
  ]

  const boxWidth = (contentWidth - 12) / 4 // 4 columns instead of 3
  const boxHeight = 18 // Smaller height
  let boxX = margin
  let boxY = yPosition

  summaryData.forEach((item, index) => {
    if (index > 0 && index % 4 === 0) {
      boxY += boxHeight + 4
      boxX = margin
    }

    // Box background
    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'F')

    // Value
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value.toString(), boxX + boxWidth / 2, boxY + 10, { align: 'center' })

    // Label
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, boxX + boxWidth / 2, boxY + 15, { align: 'center' })

    boxX += boxWidth + 4
  })

  doc.setTextColor(0, 0, 0)

  // Detailed Summary Section - Activity Logs and Comments
  yPosition = boxY + boxHeight + 15

  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  // Detailed Summary Header
  doc.setFillColor(52, 73, 94) // Dark blue-gray
  doc.rect(margin, yPosition, contentWidth, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Activity Summary', margin + 5, yPosition + 10)
  doc.setTextColor(0, 0, 0)
  yPosition += 20

  // Helper function to format update text from changes
  const formatUpdateText = (changes: any, updatedBy: string, updatedAt: string): string => {
    const updateTexts: string[] = []

    if (changes.old && changes.new) {
      Object.keys(changes.new).forEach((key) => {
        if (key.startsWith('$')) return // Skip system fields

        const oldValue = changes.old[key]
        const newValue = changes.new[key]

        if (oldValue !== newValue) {
          let changeText = ''

          if (key === 'status') {
            changeText = `Status: ${oldValue || 'N/A'} → ${newValue || 'N/A'}`
          } else if (key === 'name') {
            changeText = `Name changed: "${oldValue || 'N/A'}" → "${newValue || 'N/A'}"`
          } else if (key === 'description') {
            changeText = `Description updated`
          } else if (key === 'assigneeIds') {
            changeText = `Assignees updated`
          } else if (key === 'dueDate') {
            changeText = `Due date: ${oldValue ? formatDate(String(oldValue)) : 'N/A'} → ${newValue ? formatDate(String(newValue)) : 'N/A'}`
          } else if (key === 'checkInTime') {
            changeText = `Check-in: ${oldValue ? formatTime(String(oldValue)) : 'N/A'} → ${newValue ? formatTime(String(newValue)) : 'N/A'}`
          } else if (key === 'checkOutTime') {
            changeText = `Check-out: ${oldValue ? formatTime(String(oldValue)) : 'N/A'} → ${newValue ? formatTime(String(newValue)) : 'N/A'}`
          } else if (key === 'totalHours') {
            const oldHours = oldValue ? parseFloat(Number(oldValue).toFixed(2)) : 0
            const newHours = newValue ? parseFloat(Number(newValue).toFixed(2)) : 0
            changeText = `Hours: ${oldHours}h → ${newHours}h`
          } else if (key === 'checkInAddress') {
            changeText = `Location updated`
          } else {
            changeText = `${key}: ${String(oldValue || 'N/A')} → ${String(newValue || 'N/A')}`
          }

          updateTexts.push(changeText)
        }
      })
    }

    let updateTime = 'Unknown time'
    if (updatedAt) {
      try {
        const date = new Date(updatedAt)
        updateTime = date.toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      } catch {
        updateTime = formatTime(updatedAt)
      }
    }

    if (updateTexts.length > 0) {
      return `[${updateTime}] ${updatedBy}: ${updateTexts.join(', ')}`
    }
    return `[${updateTime}] ${updatedBy}: Updated`
  }

  // Process activity logs and comments - Group by task
  const taskUpdatesMap = new Map() // taskId -> array of updates
  const attendanceUpdatesMap = new Map() // attendanceId -> array of updates

  // Group activity logs by entity
  activityLogs.forEach((log: any) => {
    try {
      const changes = parseActivityChanges(log.changes)

      if (log.entityType === ActivityEntityType.TASK) {
        const task = tasks.find(t => t.$id === log.entityId)
        if (task) {
          if (!taskUpdatesMap.has(task.$id)) {
            taskUpdatesMap.set(task.$id, [])
          }
          taskUpdatesMap.get(task.$id).push({
            type: 'update',
            text: formatUpdateText(changes, log.username || log.userEmail || 'Unknown', log.$createdAt)
          })
        }
      } else if (log.entityType === ActivityEntityType.ATTENDANCE) {
        const att = attendance.find(a => a.$id === log.entityId)
        if (att) {
          if (!attendanceUpdatesMap.has(att.$id)) {
            attendanceUpdatesMap.set(att.$id, [])
          }
          attendanceUpdatesMap.get(att.$id).push({
            type: 'update',
            text: formatUpdateText(changes, log.username || log.userEmail || 'Unknown', log.$createdAt)
          })
        }
      }
    } catch (error) {
      console.warn('Error parsing activity log:', error)
    }
  })

  // Add comments to task updates
  comments.forEach((comment: any) => {
    const task = tasks.find(t => t.$id === comment.taskId)
    if (task) {
      if (!taskUpdatesMap.has(task.$id)) {
        taskUpdatesMap.set(task.$id, [])
      }
      let commentTime = 'Unknown time'
      if (comment.$createdAt) {
        try {
          const date = new Date(comment.$createdAt)
          commentTime = date.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        } catch {
          commentTime = formatTime(comment.$createdAt)
        }
      }
      const author = comment.username || 'Unknown'
      const commentText = comment.content ? (comment.content.length > 100 ? comment.content.substring(0, 100) + '...' : comment.content) : 'No content'
      taskUpdatesMap.get(task.$id).push({
        type: 'comment',
        text: `[${commentTime}] ${author} commented: "${commentText}"`
      })
    }
  })

  // Tasks by Project Section
  const tasksWithUpdates = tasks.filter(t => taskUpdatesMap.has(t.$id) || comments.some(c => c.taskId === t.$id))
  if (tasksWithUpdates.length > 0) {
    // Group tasks by project
    const tasksByProject = new Map()
    tasksWithUpdates.forEach((task: any) => {
      const projectId = task.projectId || 'no-project'
      if (!tasksByProject.has(projectId)) {
        tasksByProject.set(projectId, [])
      }
      tasksByProject.get(projectId).push(task)
    })

    // Process each project - Skip "No Project" if empty or show it last
    const sortedProjects = Array.from(tasksByProject.entries()).sort((a, b) => {
      // Put "no-project" at the end
      if (a[0] === 'no-project') return 1
      if (b[0] === 'no-project') return -1
      return 0
    })

    sortedProjects.forEach(([projectId, projectTasks]: [string, any[]]) => {
      // Skip "No Project" section if it's empty
      if (projectId === 'no-project' && projectTasks.length === 0) {
        return
      }

      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = margin
      }

      let projectName = 'No Project'

      if (projectId !== 'no-project') {
        const project = projectsMap.get(projectId)
        if (project && project.name) {
          projectName = project.name
        } else {
          // Project ID exists but project not found - might be deleted or missing
          console.warn(`Project with ID ${projectId} not found in projects map. Map size: ${projectsMap.size}`)
          console.warn(`Looking for projectId: ${projectId}`)
          console.warn(`Available project IDs in map:`, Array.from(projectsMap.keys()).slice(0, 5))
          // Don't show the ID, just show "Unknown Project"
          projectName = 'Unknown Project'
        }
      }

      // Project header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(52, 73, 94)
      doc.text(`Project: ${projectName}`, margin + 5, yPosition)
      yPosition += 8

      // Build table data
      const tableData = projectTasks.map((task: any) => {
        const updates = taskUpdatesMap.get(task.$id) || []
        const updatesText = updates.map((u: any) => u.text).join(' | ')
        return [
          task.name || 'Unnamed Task',
          updatesText || 'No updates today'
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Task Name', "Today's Updates"]],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 130 }
        },
        margin: { left: margin, right: margin }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    })
  }

  // Attendance Updates Section - Group by Workspace
  const attendanceWithUpdates = attendance.filter(a => attendanceUpdatesMap.has(a.$id))
  if (attendanceWithUpdates.length > 0) {
    // Group attendance by workspace
    const attendanceByWorkspace = new Map()
    attendanceWithUpdates.forEach((att: any) => {
      if (!attendanceByWorkspace.has(att.workspaceId)) {
        attendanceByWorkspace.set(att.workspaceId, [])
      }
      attendanceByWorkspace.get(att.workspaceId).push(att)
    })

    // Process each workspace
    attendanceByWorkspace.forEach((workspaceAttendance: any[], workspaceId: string) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = margin
      }

      const workspace = workspaces.find(w => w.$id === workspaceId)
      const workspaceName = workspace ? workspace.name : 'Unknown Workspace'

      // Workspace header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(52, 73, 94)
      doc.text(`Workspace: ${workspaceName}`, margin + 5, yPosition)
      yPosition += 8

      // Build table data
      const tableData = workspaceAttendance.map((att: any) => {
        const member = membersMap.get(`${att.workspaceId}-${att.userId}`)
        const memberName = member ? (member.name || member.email || 'Unknown') : 'Unknown'
        const updates = attendanceUpdatesMap.get(att.$id) || []
        const updatesText = updates.map((u: any) => u.text).join(' | ')
        return [
          memberName,
          updatesText || 'No updates today'
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Employee Name', "Today's Updates"]],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 130 }
        },
        margin: { left: margin, right: margin }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    })
  }

  // Leads Updates Section - Group by Workspace
  // Note: We don't have lead activity logs yet, but we can show leads created today
  if (leads.length > 0) {
    // Group leads by workspace
    const leadsByWorkspace = new Map()
    leads.forEach((lead: any) => {
      if (!leadsByWorkspace.has(lead.workspaceId)) {
        leadsByWorkspace.set(lead.workspaceId, [])
      }
      leadsByWorkspace.get(lead.workspaceId).push(lead)
    })

    // Process each workspace
    leadsByWorkspace.forEach((workspaceLeads: any[], workspaceId: string) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = margin
      }

      const workspace = workspaces.find(w => w.$id === workspaceId)
      const workspaceName = workspace ? workspace.name : 'Unknown Workspace'

      // Workspace header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(52, 73, 94)
      doc.text(`Workspace: ${workspaceName}`, margin + 5, yPosition)
      yPosition += 8

      // Build table data
      const tableData = workspaceLeads.map((lead: any) => {
        const leadName = lead.name || lead.companyName || 'Unnamed Lead'
        let updateText = 'Created today'
        if (lead.$createdAt) {
          try {
            const date = new Date(lead.$createdAt)
            const createTime = date.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            updateText = `Created at ${createTime}`
          } catch {
            updateText = 'Created today'
          }
        }
        return [
          leadName,
          updateText
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Lead Name', "Today's Updates"]],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 130 }
        },
        margin: { left: margin, right: margin }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    })
  }

  // Footer
  const footerY = pageHeight - 15
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate HTML report content
 */
function generateHTMLReport(data: {
  date: string
  tasks: any[]
  attendance: any[]
  leads: any[]
  membersMap: Map<string, any>
  workspaces: any[]
}): string {
  const { date, tasks, attendance, leads, membersMap, workspaces } = data

  // Group data by workspace
  const tasksByWorkspace = new Map()
  const attendanceByWorkspace = new Map()
  const leadsByWorkspace = new Map()

  tasks.forEach(task => {
    if (!tasksByWorkspace.has(task.workspaceId)) {
      tasksByWorkspace.set(task.workspaceId, [])
    }
    tasksByWorkspace.get(task.workspaceId).push(task)
  })

  attendance.forEach(att => {
    if (!attendanceByWorkspace.has(att.workspaceId)) {
      attendanceByWorkspace.set(att.workspaceId, [])
    }
    attendanceByWorkspace.get(att.workspaceId).push(att)
  })

  leads.forEach(lead => {
    if (!leadsByWorkspace.has(lead.workspaceId)) {
      leadsByWorkspace.set(lead.workspaceId, [])
    }
    leadsByWorkspace.get(lead.workspaceId).push(lead)
  })

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .section { margin-bottom: 30px; }
        .workspace-section { margin-bottom: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .workspace-header { background: #e9ecef; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
        .item { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .status-present { background: #d4edda; color: #155724; }
        .status-absent { background: #f8d7da; color: #721c24; }
        .status-late { background: #fff3cd; color: #856404; }
        .summary { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 20px; }
        h1 { color: #2c3e50; margin-bottom: 10px; }
        h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        h3 { color: #34495e; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Activity Report</h1>
        <p><strong>Date:</strong> ${formatDate(date)}</p>
        <p><strong>Workspaces:</strong> ${workspaces.length}</p>
      </div>
  `

  // Workspace Sections
  workspaces.forEach(workspace => {
    const workspaceTasks = tasksByWorkspace.get(workspace.$id) || []
    const workspaceAttendance = attendanceByWorkspace.get(workspace.$id) || []
    const workspaceLeads = leadsByWorkspace.get(workspace.$id) || []

    // Skip workspace if no data
    if (workspaceTasks.length === 0 && workspaceAttendance.length === 0 && workspaceLeads.length === 0) {
      return
    }

    html += `
      <div class="workspace-section">
        <div class="workspace-header">
          <img src="${workspace.logo}" alt="${workspace.name}" style="width: 100px; height: 100px; object-fit: contain;">
          <h2>${workspace.name}</h2>
        </div>
    `

    // Tasks
    if (workspaceTasks.length > 0) {
      html += `<h3>Tasks (${workspaceTasks.length})</h3>`
      workspaceTasks.forEach((task: any) => {
        const assignees = task.assigneeIds?.map((id: string) => {
          // Try lookup by member document ID first
          let member = membersMap.get(`${task.workspaceId}-${id}`)

          // If not found, try to find by searching all members (fallback)
          if (!member) {
            const entries = Array.from(membersMap.entries())
            for (const [key, value] of entries) {
              if (key.includes(id) || (value as any).$id === id) {
                member = value
                break
              }
            }
          }

          return member ? (member.name || member.email || 'Unknown') : 'Unknown'
        }).join(', ') || 'Unassigned'

        const statusClass = `status-${task.status?.toLowerCase() || 'todo'}`
        const statusText = task.status || 'TODO'

        html += `
          <div class="item">
            <h4>${task.name}</h4>
            ${task.description ? `<p>${task.description}</p>` : ''}
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
            <p><strong>Assignees:</strong> ${assignees}</p>
            <p><strong>Due:</strong> ${formatDate(task.dueDate)}</p>
          </div>
        `
      })
    }

    // Attendance
    if (workspaceAttendance.length > 0) {
      html += `<h3> Attendance (${workspaceAttendance.length})</h3>`
      workspaceAttendance.forEach((att: any) => {
        const member = membersMap.get(`${att.workspaceId}-${att.userId}`)
        const memberName = member ? (member.name || member.email || 'Unknown User') : 'Unknown User'

        const statusClass = `status-${att.status}`
        const statusText = att.status.toUpperCase()

        html += `
          <div class="item">
            <h4>${memberName}</h4>
            <p><strong>Date:</strong> ${formatDate(att.date)}</p>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
            ${att.checkInTime ? `<p><strong>Check-in:</strong> ${formatTime(String(att.checkInTime))}</p>` : ''}
            ${att.checkOutTime ? `<p><strong>Check-out:</strong> ${formatTime(String(att.checkOutTime))}</p>` : ''}
            ${att.totalHours ? `<p><strong>Hours:</strong> ${parseFloat(Number(att.totalHours).toFixed(2))}h</p>` : ''}
          </div>
        `
      })
    }

    // Leads
    if (workspaceLeads.length > 0) {
      html += `<h3> Leads (${workspaceLeads.length})</h3>`
      workspaceLeads.forEach((lead: any) => {
        const assignee = lead.assignedTo ? membersMap.get(`${lead.workspaceId}-${lead.assignedTo}`) : null
        const assigneeName = assignee ? (assignee.name || assignee.email || 'Unassigned') : 'Unassigned'

        html += `
          <div class="item">
            <h4>${lead.name || lead.companyName || 'Unnamed Lead'}</h4>
            ${lead.email ? `<p><strong>Email:</strong> ${lead.email}</p>` : ''}
            ${lead.phone ? `<p><strong>Phone:</strong> ${lead.phone}</p>` : ''}
            <p><strong>Status:</strong> ${lead.status || 'New'}</p>
            <p><strong>Assigned to:</strong> ${assigneeName}</p>
          </div>
        `
      })
    }

    html += `</div>`
  })

  // Summary
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length
  const pendingTasks = tasks.filter(task => task.status === TaskStatus.TODO || task.status === TaskStatus.BACKLOG).length
  const presentCount = attendance.filter(att => att.status === 'present').length
  const notPresentMembers = attendance.filter(att => att.status === 'absent').length

  html += `
    <div class="summary">
      <h2>Summary</h2>
      <ul>
        <li><strong>Total Tasks:</strong> ${totalTasks}</li>
        <li><strong>Completed Tasks:</strong> ${completedTasks}</li>
        <li><strong>In Progress Tasks:</strong> ${inProgressTasks}</li>
        <li><strong>Pending Tasks:</strong> ${pendingTasks}</li>
        <li><strong>Attendance Records:</strong> ${attendance.length}</li>
        <li><strong>Present:</strong> ${presentCount}</li>
        <li><strong>Not Present:</strong> ${notPresentMembers}</li>
        <li><strong>Total Leads:</strong> ${leads.length}</li>
      </ul>
    </div>
  `

  html += `
    </body>
    </html>
  `

  return html
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Format time for display (convert to IST and 12h format)
 * Handles time strings like "12:49", "12:49:00", ISO timestamps, or already formatted times
 * Converts UTC times to IST (Kolkata timezone, UTC+5:30)
 */
function formatTime(timeString: string): string {
  try {
    if (!timeString) return timeString

    // If it's already in 12h format with AM/PM, return as is
    if (timeString.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/)) {
      return timeString
    }

    // Handle ISO timestamp format (e.g., "2024-11-21T12:49:00.000Z")
    // Convert to IST (Asia/Kolkata) timezone
    if (timeString.includes('T')) {
      const date = new Date(timeString)

      // Convert to IST (Asia/Kolkata timezone)
      const istTimeString = date.toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      return istTimeString
    }

    // Handle simple time format (e.g., "12:49" or "12:49:00")
    // Assume it's already in IST if it's just a time string
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10)

      if (!isNaN(hours) && !isNaN(minutes)) {
        const ampm = hours >= 12 ? 'PM' : 'AM'
        let displayHour = hours % 12
        displayHour = displayHour || 12 // Convert 0 to 12

        return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`
      }
    }

    // If we can't parse it, return as is
    return timeString
  } catch (error) {
    console.warn('Error formatting time:', timeString, error)
    return timeString
  }
}