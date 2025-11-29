import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.leaveApproval.deleteMany()
  await prisma.leaveRequest.deleteMany()

  console.log('✅ Cleared existing data')

  // Sample leave request 1 - Pending
  const request1 = await prisma.leaveRequest.create({
    data: {
      formResponseId: 'test_response_001',
      employeeName: 'aman bey',
      managerName: 'Jaebum Park',
      leaveType: 'Vacation',
      startDate: new Date('2022-04-22'),
      endDate: new Date('2022-04-28'),
      shiftType: 'Full Shift',
      reason: 'Personal',
      status: 'PENDING',
      durationDays: 5,
      submittedAt: new Date('2022-04-22T09:00:00')
    }
  })
  console.log(`✅ Created leave request: ${request1.employeeName} - ${request1.status}`)

  // Sample leave request 2 - Pending
  const request2 = await prisma.leaveRequest.create({
    data: {
      formResponseId: 'test_response_002',
      employeeName: 'Abebe kebede',
      managerName: 'Jinsoo Park',
      leaveType: 'Sick Leave',
      startDate: new Date('2022-04-22'),
      endDate: new Date('2022-04-30'),
      shiftType: 'Full Shift',
      reason: 'Medical appointment',
      status: 'PENDING',
      durationDays: 7,
      submittedAt: new Date('2022-04-22T10:30:00')
    }
  })
  console.log(`✅ Created leave request: ${request2.employeeName} - ${request2.status}`)

  // Sample leave request 3 - Approved
  const request3 = await prisma.leaveRequest.create({
    data: {
      formResponseId: 'test_response_003',
      employeeName: 'daniel',
      managerName: 'Ian Lee',
      leaveType: 'Vacation',
      startDate: new Date('2022-04-25'),
      endDate: new Date('2022-05-01'),
      shiftType: 'Full Shift',
      reason: 'Family trip',
      status: 'APPROVED',
      durationDays: 7,
      submittedAt: new Date('2022-04-20T14:00:00')
    }
  })
  console.log(`✅ Created leave request: ${request3.employeeName} - ${request3.status}`)

  // Create approval for request 3
  await prisma.leaveApproval.create({
    data: {
      requestId: request3.id,
      action: 'APPROVED',
      approvedBy: 'HR Manager',
      adminNotes: 'Approved - sufficient notice given'
    }
  })

  // Create audit log for request 3
  await prisma.auditLog.create({
    data: {
      entityType: 'leave_request',
      entityId: request3.id,
      action: 'APPROVED',
      performedBy: 'HR Manager',
      status: 'SUCCESS',
      metadata: JSON.stringify({ notes: 'Approved - sufficient notice given' })
    }
  })

  // Sample leave request 4 - Denied
  const request4 = await prisma.leaveRequest.create({
    data: {
      formResponseId: 'test_response_004',
      employeeName: 'feven tesfaye',
      managerName: 'Jaebum Park',
      leaveType: 'Unpaid',
      startDate: new Date('2022-04-23'),
      endDate: new Date('2022-04-27'),
      shiftType: 'First-Half',
      reason: 'Personal reasons',
      status: 'DENIED',
      durationDays: 5,
      submittedAt: new Date('2022-04-22T15:00:00')
    }
  })
  console.log(`✅ Created leave request: ${request4.employeeName} - ${request4.status}`)

  // Create approval for request 4 (DENIED)
  await prisma.leaveApproval.create({
    data: {
      requestId: request4.id,
      action: 'DENIED',
      approvedBy: 'HR Manager',
      adminNotes: 'Insufficient notice period'
    }
  })

  // Create audit log for request 4
  await prisma.auditLog.create({
    data: {
      entityType: 'leave_request',
      entityId: request4.id,
      action: 'DENIED',
      performedBy: 'HR Manager',
      status: 'SUCCESS',
      metadata: JSON.stringify({ notes: 'Insufficient notice period' })
    }
  })

  // Sample leave request 5 - Pending
  const request5 = await prisma.leaveRequest.create({
    data: {
      formResponseId: 'test_response_005',
      employeeName: 'tedia atalay',
      managerName: 'Jinsoo Park',
      leaveType: 'Sick Leave',
      startDate: new Date('2022-04-24'),
      endDate: new Date('2022-04-28'),
      shiftType: 'Second-Half',
      reason: 'Doctor appointment',
      status: 'PENDING',
      durationDays: 5,
      submittedAt: new Date('2022-04-23T08:00:00')
    }
  })
  console.log(`✅ Created leave request: ${request5.employeeName} - ${request5.status}`)

  console.log('\n📊 Seed Summary:')
  console.log('  - Total requests: 5')
  console.log('  - Pending: 3')
  console.log('  - Approved: 1')
  console.log('  - Denied: 1')
  console.log('\n🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
