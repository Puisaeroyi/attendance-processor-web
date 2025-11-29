import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { config } from 'dotenv'

// Load environment variables from .env and .env.local files
config({ path: '.env' })
config({ path: '.env.local' })

const prisma = new PrismaClient()

// SECURITY: Require password from environment variable
function getDefaultPassword(): string {
  const password = process.env.ADMIN_DEFAULT_PASSWORD
  if (!password) {
    throw new Error('ADMIN_DEFAULT_PASSWORD environment variable is required for seeding')
  }
  return password
}

// 6 users with specified usernames
const USERS = [
  { username: 'silver', firstName: 'Silver', lastName: 'Bui', role: 'USER' },
  { username: 'capone', firstName: 'Capone', lastName: 'Pham', role: 'USER' },
  { username: 'matthew', firstName: 'Matthew', lastName: 'Mac', role: 'USER' },
  { username: 'akared', firstName: 'Akared', lastName: 'Nguyen', role: 'USER' },
  { username: 'thomas', firstName: 'Thomas', lastName: 'Nguyen', role: 'MANAGER' },
  { username: 'admin', firstName: 'System', lastName: 'Administrator', role: 'ADMIN' },
]

async function main() {
  console.log('🌱 Starting user seeding...')

  try {
    // Hash the default password once
    const defaultPassword = getDefaultPassword()
    const passwordHash = await bcryptjs.hash(defaultPassword, 12)

    console.log(`📋 Creating ${USERS.length} users...`)

    for (const userData of USERS) {
      console.log(`👤 Creating user: ${userData.username} (${userData.role})`)

      await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          email: `${userData.username}@company.local`,
          passwordHash,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
          isEmailVerified: true,
        },
        create: {
          username: userData.username,
          email: `${userData.username}@company.local`,
          passwordHash,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
          isEmailVerified: true,
        }
      })

      console.log(`✅ Seeded user: ${userData.username}`)
    }

    // Summary
    const totalUsers = await prisma.user.count()
    const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } })
    const managerUsers = await prisma.user.count({ where: { role: 'MANAGER' } })
    const operatorUsers = await prisma.user.count({ where: { role: 'USER' } })

    console.log('\n📊 Seeding Summary:')
    console.log(`   Total users: ${totalUsers}`)
    console.log(`   Admin users: ${adminUsers}`)
    console.log(`   Manager users: ${managerUsers}`)
    console.log(`   Operator users: ${operatorUsers}`)

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: null,
        entityType: 'SYSTEM',
        entityId: 0,
        action: 'USER_SEEDING',
        performedBy: 'SYSTEM',
        status: 'SUCCESS',
        reason: `Seeded ${totalUsers} users with default passwords`,
        metadata: JSON.stringify({
          totalUsers,
          adminUsers,
          managerUsers,
          operatorUsers,
          defaultPassword: '******'
        })
      }
    })

    console.log('✅ User seeding completed successfully!')
    console.log('🔑 Default password: Set via ADMIN_DEFAULT_PASSWORD env variable')
    console.log('\n👥 Available users:')
    USERS.forEach(u => console.log(`   - ${u.username} (${u.role})`))

  } catch (error) {
    console.error('❌ User seeding failed:', error)
    await prisma.auditLog.create({
      data: {
        userId: null,
        entityType: 'SYSTEM',
        entityId: 0,
        action: 'USER_SEEDING',
        performedBy: 'SYSTEM',
        status: 'FAILURE',
        reason: `User seeding failed: ${error}`,
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : String(error) })
      }
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(async () => {
    console.log('🌱 User seeding process completed')
  })
  .catch(async (e) => {
    console.error('❌ User seeding failed:', e)
    process.exit(1)
  })
