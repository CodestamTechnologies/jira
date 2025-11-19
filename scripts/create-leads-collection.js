const { Client, Databases } = require('node-appwrite')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {})

  // Set environment variables
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key]
  })
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.NEXT_APPWRITE_KEY) // Server-side API key

const databases = new Databases(client)

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

async function createLeadsCollection() {
  try {
    console.log('Creating leads collection...')

    if (!DATABASE_ID) {
      throw new Error('Database ID not configured')
    }

    // Define the leads collection schema
    const collectionData = {
      name: 'Leads',
      permissions: [
        'create("users")',
        'read("users")',
        'update("users")',
        'delete("users")'
      ],
      documentSecurity: true,
      attributes: [
        {
          key: 'workspaceId',
          type: 'string',
          size: 255,
          required: true,
        },
        {
          key: 'name',
          type: 'string',
          size: 100,
          required: true,
        },
        {
          key: 'email',
          type: 'string',
          size: 255,
          required: true,
        },
        {
          key: 'phone',
          type: 'string',
          size: 20,
          required: false,
        },
        {
          key: 'company',
          type: 'string',
          size: 100,
          required: false,
        },
        {
          key: 'website',
          type: 'string',
          size: 500,
          required: false,
        },
        {
          key: 'source',
          type: 'string',
          size: 50,
          required: false,
        },
        {
          key: 'status',
          type: 'string',
          size: 50,
          required: false,
        },
        {
          key: 'priority',
          type: 'string',
          size: 50,
          required: false,
        },
        {
          key: 'description',
          type: 'string',
          size: 1000,
          required: false,
        },
        {
          key: 'notes',
          type: 'string',
          size: 1000,
          required: false,
        },
        {
          key: 'assignedTo',
          type: 'string',
          size: 255,
          required: false,
        },
        {
          key: 'assigneeIds',
          type: 'string',
          size: 5000, // Store as JSON string (larger for arrays)
          required: false,
        },
        {
          key: 'createdBy',
          type: 'string',
          size: 255,
          required: true,
        },
        {
          key: 'comments',
          type: 'string',
          size: 10000, // Store as JSON string
          required: false,
        },
      ],
      indexes: [
        {
          key: 'workspace_created_by_idx',
          type: 'key',
          attributes: ['workspaceId', 'createdBy'],
          orders: ['ASC', 'ASC']
        },
        {
          key: 'workspace_idx',
          type: 'key',
          attributes: ['workspaceId'],
          orders: ['ASC']
        },
        {
          key: 'created_by_idx',
          type: 'key',
          attributes: ['createdBy'],
          orders: ['ASC']
        }
      ]
    }

    console.log('Creating collection with data:', JSON.stringify(collectionData, null, 2))

    const collection = await databases.createCollection(
      DATABASE_ID,
      'unique()', // Let Appwrite generate the ID
      collectionData.name,
      collectionData.permissions,
      collectionData.documentSecurity
    )

    console.log('Collection created with ID:', collection.$id)

    // Add attributes
    for (const attribute of collectionData.attributes) {
      console.log(`Adding attribute: ${attribute.key}`)
      if (attribute.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          collection.$id,
          attribute.key,
          attribute.size,
          attribute.required,
          attribute.default || undefined
        )
      }
    }

    // Add indexes
    for (const index of collectionData.indexes) {
      console.log(`Adding index: ${index.key}`)
      await databases.createIndex(
        DATABASE_ID,
        collection.$id,
        index.key,
        index.type,
        index.attributes,
        index.orders
      )
    }

    console.log('✅ Leads collection created successfully!')
    console.log(`📝 Collection ID: ${collection.$id}`)
    console.log(`🔧 Update your .env.local file with: NEXT_PUBLIC_APPWRITE_LEADS_ID=${collection.$id}`)

    return collection.$id

  } catch (error) {
    console.error('❌ Failed to create leads collection:', error)

    // If collection already exists, try to get its ID
    if (error.message?.includes('already exists')) {
      try {
        console.log('Collection might already exist, trying to find it...')
        const collections = await databases.listCollections(DATABASE_ID)

        const leadsCollection = collections.collections.find(c =>
          c.name.toLowerCase().includes('lead')
        )

        if (leadsCollection) {
          console.log(`📝 Found existing leads collection with ID: ${leadsCollection.$id}`)
          console.log(`🔧 Update your .env.local file with: NEXT_PUBLIC_APPWRITE_LEADS_ID=${leadsCollection.$id}`)
          return leadsCollection.$id
        }
      } catch (findError) {
        console.error('Could not find existing collection:', findError)
      }
    }

    throw error
  }
}

// Run the collection creation
createLeadsCollection()
  .then((collectionId) => {
    console.log(`\n🎉 Success! Update your environment variable:`)
    console.log(`NEXT_PUBLIC_APPWRITE_LEADS_ID=${collectionId}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
