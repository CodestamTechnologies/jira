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
const LEADS_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_ID

async function addAssigneeIdsAttribute() {
  try {
    console.log('Adding assigneeIds attribute to leads collection...')

    if (!DATABASE_ID || !LEADS_ID) {
      throw new Error('Database ID or Leads ID not configured')
    }

    // Check if attribute already exists
    try {
      const collection = await databases.getCollection(DATABASE_ID, LEADS_ID)
      const attributes = await databases.listAttributes(DATABASE_ID, LEADS_ID)

      const assigneeIdsExists = attributes.attributes.some(
        attr => attr.key === 'assigneeIds'
      )

      if (assigneeIdsExists) {
        console.log('✅ assigneeIds attribute already exists in the collection')
        return
      }

      console.log('Creating assigneeIds attribute...')

      // Create the assigneeIds attribute
      await databases.createStringAttribute(
        DATABASE_ID,
        LEADS_ID,
        'assigneeIds',
        5000, // Size for JSON string (larger for arrays)
        false, // Not required
        undefined // No default value
      )

      console.log('✅ assigneeIds attribute created successfully!')
      console.log('⏳ Waiting for attribute to be ready (this may take a few seconds)...')

      // Wait for attribute to be ready (Appwrite needs time to process)
      let isReady = false
      let attempts = 0
      const maxAttempts = 30 // Wait up to 30 seconds

      while (!isReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        try {
          const updatedAttributes = await databases.listAttributes(DATABASE_ID, LEADS_ID)
          const assigneeIdsAttr = updatedAttributes.attributes.find(
            attr => attr.key === 'assigneeIds'
          )

          if (assigneeIdsAttr && assigneeIdsAttr.status === 'available') {
            isReady = true
            console.log('✅ assigneeIds attribute is now ready!')
          } else {
            attempts++
            if (attempts % 5 === 0) {
              console.log(`⏳ Still waiting... (${attempts}/${maxAttempts} seconds)`)
            }
          }
        } catch (error) {
          // Continue waiting
          attempts++
        }
      }

      if (!isReady) {
        console.log('⚠️  Attribute creation is still processing. It should be ready soon.')
        console.log('   You can check the status in the Appwrite console.')
      }

    } catch (error) {
      if (error.message?.includes('already exists') || error.code === 409) {
        console.log('✅ assigneeIds attribute already exists')
      } else {
        throw error
      }
    }

  } catch (error) {
    console.error('❌ Failed to add assigneeIds attribute:', error)
    throw error
  }
}

// Run the script
addAssigneeIdsAttribute()
  .then(() => {
    console.log('\n🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
