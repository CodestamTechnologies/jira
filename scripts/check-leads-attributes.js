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
  .setKey(process.env.NEXT_APPWRITE_KEY)

const databases = new Databases(client)

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const LEADS_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_ID

async function checkAttributes() {
  try {
    console.log('Checking leads collection attributes...\n')

    if (!DATABASE_ID || !LEADS_ID) {
      throw new Error('Database ID or Leads ID not configured')
    }

    const attributes = await databases.listAttributes(DATABASE_ID, LEADS_ID)
    
    console.log('Current attributes:')
    attributes.attributes.forEach(attr => {
      console.log(`  - ${attr.key}: ${attr.type} (status: ${attr.status})`)
    })

    const commentsAttr = attributes.attributes.find(attr => attr.key === 'comments')
    
    if (commentsAttr) {
      console.log(`\nComments attribute type: ${commentsAttr.type}`)
      if (commentsAttr.type === 'string') {
        console.log('✅ Comments is correctly set as string type')
      } else {
        console.log(`⚠️  Comments is set as ${commentsAttr.type} type, but code expects string`)
        console.log('   You may need to delete and recreate the comments attribute as string type')
      }
    } else {
      console.log('\n⚠️  Comments attribute not found')
    }

  } catch (error) {
    console.error('❌ Error checking attributes:', error)
    throw error
  }
}

checkAttributes()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
