import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

/**
 * Clear all data from database (development only)
 */
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.leaveApproval.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log('  ✓ Database cleared')
}

/**
 * Seed users (5 operators + 1 admin)
 */
async function seedUsers() {
  console.log('👥 Seeding users...')

  const defaultPassword = await hashPassword('Password123!')

  const users = [
    // Operators from users.yaml
    {
      email: 'silver.bui@example.com',
      username: 'Silver_Bui',
      firstName: 'Bui',
      lastName: 'Duc Toan',
      role: 'USER',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'capone@example.com',
      username: 'Capone',
      firstName: 'Pham',
      lastName: 'Tan Phat',
      role: 'USER',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'minh@example.com',
      username: 'Minh',
      firstName: 'Mac Le',
      lastName: 'Duc Minh',
      role: 'USER',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'trieu@example.com',
      username: 'Trieu',
      firstName: 'Nguyen',
      lastName: 'Hoang Trieu',
      role: 'USER',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'thomas.nguyen@example.com',
      username: 'Thomas_Nguyen',
      firstName: 'Nguyen Thanh',
      lastName: 'Thao Nguyen',
      role: 'MANAGER',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
    // Admin user
    {
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      passwordHash: defaultPassword,
      isActive: true,
      isEmailVerified: true,
    },
  ]

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      await tx.user.create({ data: user })
      console.log(`  ✓ Created ${user.role}: ${user.username} (${user.email})`)
    }
  })

  console.log(`  ✅ Created ${users.length} users`)
}

/**
 * Seed sample leave requests for testing
 */
async function seedLeaveRequests() {
  console.log('📝 Seeding sample leave requests...')

  const users = await prisma.user.findMany({
    where: { role: {in: ['USER', 'MANAGER']} },
    select: { username: true }
  })

  if (users.length === 0) {
    console.log('  ⚠️  No users found, skipping leave requests')
    return
  }

  const leaveRequests = [
    {
      formResponseId: 'seed_001',
      employeeName: users[0]!.username,
      managerName: 'Manager A',
      leaveType: 'Annual Leave',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-03'),
      shiftType: 'Full Day',
      reason: 'Family vacation',
      status: 'PENDING',
      durationDays: 3,
      submittedAt: new Date('2025-11-20'),
    },
    {
      formResponseId: 'seed_002',
      employeeName: users[1]?.username || users[0]!.username,
      managerName: 'Manager B',
      leaveType: 'Sick Leave',
      startDate: new Date('2025-11-28'),
      endDate: new Date('2025-11-28'),
      shiftType: 'Half Day',
      reason: 'Medical appointment',
      status: 'APPROVED',
      durationDays: 1,
      submittedAt: new Date('2025-11-25'),
    },
  ]

  await prisma.$transaction(async (tx) => {
    for (const request of leaveRequests) {
      await tx.leaveRequest.create({ data: request })
      console.log(`  ✓ Created leave request: ${request.formResponseId}`)
    }
  })

  console.log(`  ✅ Created ${leaveRequests.length} leave requests`)
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seed...\n')

  try {
    await clearDatabase()
    await seedUsers()
    await seedLeaveRequests()

    console.log('\n✅ Database seeding complete!')
    console.log('\n📋 Login credentials:')
    console.log('   Email: admin@example.com (ADMIN)')
    console.log('   Email: thomas.nguyen@example.com (MANAGER)')
    console.log('   Email: silver.bui@example.com (USER)')
    console.log('   Password: [See SEED_PASSWORD env or check seed.ts]\n')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
