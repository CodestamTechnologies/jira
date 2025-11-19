const { Client, Databases, Query } = require('node-appwrite')

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY) // Server-side API key

const databases = new Databases(client)

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const LEADS_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_ID

async function migrateLeadsToWorkspaces() {
  try {
    console.log('Starting leads workspace migration...')

    if (!DATABASE_ID || !LEADS_ID) {
      throw new Error('Database IDs not configured')
    }

    // Get all leads (without workspace filter to find orphaned leads)
    const leads = await databases.listDocuments(DATABASE_ID, LEADS_ID, [
      Query.limit(1000) // Adjust limit as needed
    ])

    console.log(`Found ${leads.documents.length} total leads`)

    const leadsWithoutWorkspace = []
    const leadsWithWorkspace = []

    // Categorize leads
    leads.documents.forEach(doc => {
      if (!doc.workspaceId) {
        leadsWithoutWorkspace.push(doc)
      } else {
        leadsWithWorkspace.push(doc)
      }
    })

    console.log(`Leads with workspaceId: ${leadsWithWorkspace.length}`)
    console.log(`Leads without workspaceId: ${leadsWithoutWorkspace.length}`)

    if (leadsWithoutWorkspace.length === 0) {
      console.log('No leads need migration. All leads have workspaceId.')
      return
    }

    // For leads without workspaceId, we need to determine appropriate workspace
    // This is a complex decision that depends on your business logic
    // For now, we'll create a report and suggest manual intervention

    console.log('\nLeads without workspaceId:')
    leadsWithoutWorkspace.forEach(lead => {
      console.log(`- ID: ${lead.$id}, Name: ${lead.name}, CreatedBy: ${lead.createdBy}, CreatedAt: ${lead.$createdAt}`)
    })

    console.log('\nMigration Options:')
    console.log('1. Assign all orphaned leads to a default workspace')
    console.log('2. Assign leads based on createdBy user\'s primary workspace')
    console.log('3. Delete orphaned leads')
    console.log('4. Manual assignment (recommended)')

    // For this script, we'll implement option 2: assign based on user's primary workspace
    // But first, we need to get workspaces and members data

    // Get all workspaces
    const workspaces = await databases.listDocuments(
      DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID,
      [Query.limit(1000)]
    )

    // Get all members
    const members = await databases.listDocuments(
      DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID,
      [Query.limit(1000)]
    )

    console.log(`\nFound ${workspaces.documents.length} workspaces and ${members.documents.length} members`)

    // Create a map of userId -> workspaceId (user's primary workspace)
    const userWorkspaceMap = new Map()

    members.documents.forEach(member => {
      if (!userWorkspaceMap.has(member.userId)) {
        userWorkspaceMap.set(member.userId, member.workspaceId)
      }
    })

    // Migrate leads
    let migrated = 0
    let skipped = 0

    for (const lead of leadsWithoutWorkspace) {
      const userWorkspaceId = userWorkspaceMap.get(lead.createdBy)

      if (userWorkspaceId) {
        try {
          await databases.updateDocument(DATABASE_ID, LEADS_ID, lead.$id, {
            workspaceId: userWorkspaceId
          })
          console.log(`✓ Migrated lead ${lead.$id} (${lead.name}) to workspace ${userWorkspaceId}`)
          migrated++
        } catch (error) {
          console.error(`✗ Failed to migrate lead ${lead.$id}:`, error.message)
          skipped++
        }
      } else {
        console.log(`⚠ Skipping lead ${lead.$id} (${lead.name}) - no workspace found for creator ${lead.createdBy}`)
        skipped++
      }
    }

    console.log(`\nMigration complete:`)
    console.log(`- Migrated: ${migrated}`)
    console.log(`- Skipped: ${skipped}`)
    console.log(`- Total processed: ${migrated + skipped}`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateLeadsToWorkspaces()
  .then(() => {
    console.log('Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })

