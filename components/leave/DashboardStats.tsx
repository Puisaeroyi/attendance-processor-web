'use client'

interface StatsProps {
  stats: {
    overview: {
      total: number
      pending: number
      approved: number
      denied: number
      approvedDaysThisMonth: number
      archived?: number
      deleted?: number
      expiringSoon?: number
    }
    recentRequests: unknown[]
    upcomingLeaves: unknown[]
  }
}

export function DashboardStats({ stats }: StatsProps) {
  const { overview } = stats

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Primary Stats Card - Most Important Information */}
      <div className="lg:col-span-2">
        <PrimaryStatsCard
          total={overview.total}
          pending={overview.pending}
          approved={overview.approved}
          denied={overview.denied}
        />
      </div>

      {/* Consolidated Removed Card - Archived & Deleted */}
      <ConsolidatedRemovedCard
        archived={overview.archived || 0}
        deleted={overview.deleted || 0}
        expiringSoon={overview.expiringSoon || 0}
      />

      {/* Days Off Card - Enhanced */}
      <DaysOffCard
        approvedDays={overview.approvedDaysThisMonth}
      />
    </div>
  )
}

// Primary Stats Card - Shows most important metrics with Neo Brutalism style
function PrimaryStatsCard({
  total,
  pending,
  approved,
  denied
}: {
  total: number
  pending: number
  approved: number
  denied: number
}) {
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <div className="bg-white p-8 shadow-nb-lg border-4 border-black">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Primary Statistics</h2>
        <div className="bg-blue-500 text-white px-4 py-2 border-2 border-black">
          <span className="text-sm font-bold uppercase">Total</span>
          <span className="ml-2 text-lg font-black">{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="bg-yellow-100 border-4 border-black mb-3 p-4 shadow-nb">
            <div className="text-3xl font-black text-yellow-700">{pending}</div>
          </div>
          <h3 className="text-sm font-bold uppercase text-gray-600">Pending Action</h3>
          <p className="text-xs text-gray-500 mt-1">Requires Review</p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 border-4 border-black mb-3 p-4 shadow-nb">
            <div className="text-3xl font-black text-green-700">{approved}</div>
          </div>
          <h3 className="text-sm font-bold uppercase text-gray-600">Approved</h3>
          <p className="text-xs text-gray-500 mt-1">{approvalRate}% Approval Rate</p>
        </div>

        <div className="text-center">
          <div className="bg-red-100 border-4 border-black mb-3 p-4 shadow-nb">
            <div className="text-3xl font-black text-red-700">{denied}</div>
          </div>
          <h3 className="text-sm font-bold uppercase text-gray-600">Denied</h3>
          <p className="text-xs text-gray-500 mt-1">Not Approved</p>
        </div>
      </div>
    </div>
  )
}

// Consolidated Removed Card - Combines Archived and Deleted statistics
function ConsolidatedRemovedCard({
  archived,
  deleted,
  expiringSoon
}: {
  archived: number
  deleted: number
  expiringSoon: number
}) {
  const totalRemoved = archived + deleted
  const hasAnyRemoved = totalRemoved > 0

  return (
    <div className="bg-white p-6 shadow-nb border-4 border-black relative">
      {/* Warning badge for expiring deleted items */}
      {expiringSoon > 0 && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-nb-sm animate-nb-bounce-in">
          {expiringSoon} expiring soon
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-black uppercase tracking-tight mb-1">Removed Items</h3>
        <p className="text-sm font-semibold text-gray-600">Archived & Deleted Requests</p>
      </div>

      <div className="space-y-3">
        {/* Archived Section */}
        <div className="flex items-center justify-between p-3 bg-orange-50 border-2 border-black">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-orange-500 border-2 border-black"></div>
            <span className="text-sm font-bold uppercase">Archived</span>
          </div>
          <span className="text-xl font-black text-orange-700">{archived}</span>
        </div>

        {/* Deleted Section */}
        <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-black">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 border-2 border-black"></div>
            <span className="text-sm font-bold uppercase">Deleted</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-red-700">{deleted}</span>
            {expiringSoon > 0 && (
              <span className="text-xs bg-orange-500 text-white px-2 py-1 border border-black font-black">
                {expiringSoon} expiring
              </span>
            )}
          </div>
        </div>

        {/* Total Removed */}
        {hasAnyRemoved && (
          <div className="mt-4 pt-3 border-t-2 border-black">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase text-gray-600">Total Removed</span>
              <span className="text-2xl font-black text-gray-800">{totalRemoved}</span>
            </div>
          </div>
        )}

        {!hasAnyRemoved && (
          <div className="text-center py-4 text-gray-500 font-semibold">
            No archived or deleted items
          </div>
        )}
      </div>
    </div>
  )
}

// Days Off Card - Enhanced with better visual design
function DaysOffCard({
  approvedDays
}: {
  approvedDays: number
}) {
  return (
    <div className="bg-white p-6 shadow-nb border-4 border-black">
      <div className="text-center">
        <div className="bg-purple-100 border-4 border-black p-6 mb-4 shadow-nb relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 transform rotate-45 translate-x-8 -translate-y-8"></div>

          <div className="relative z-10">
            <div className="text-4xl font-black text-purple-700 mb-2">{approvedDays}</div>
            <div className="text-sm font-bold uppercase text-purple-600">Days</div>
          </div>
        </div>

        <h3 className="text-lg font-black uppercase tracking-tight mb-1">This Month</h3>
        <p className="text-sm font-semibold text-gray-600">Approved Days Off</p>

        {approvedDays > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            Team productivity impact
          </div>
        )}
      </div>
    </div>
  )
}

