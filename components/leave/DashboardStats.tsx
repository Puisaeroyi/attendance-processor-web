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
      {/* Primary Stats Card */}
      <div className="lg:col-span-2">
        <PrimaryStatsCard
          total={overview.total}
          pending={overview.pending}
          approved={overview.approved}
          denied={overview.denied}
        />
      </div>

      {/* Removed Items Card */}
      <ConsolidatedRemovedCard
        archived={overview.archived || 0}
        deleted={overview.deleted || 0}
        expiringSoon={overview.expiringSoon || 0}
      />

      {/* Days Off Card */}
      <DaysOffCard
        approvedDays={overview.approvedDaysThisMonth}
      />
    </div>
  )
}

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
    <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Primary Statistics</h2>
        <div className="bg-blue-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-blue-400/30">
          <span className="text-sm font-medium">Total</span>
          <span className="ml-2 text-lg font-bold">{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 mb-3">
            <div className="text-3xl font-bold text-yellow-200">{pending}</div>
          </div>
          <h3 className="text-sm font-medium text-white/80">Pending Action</h3>
          <p className="text-xs text-white/60 mt-1">Requires Review</p>
        </div>

        <div className="text-center">
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 mb-3">
            <div className="text-3xl font-bold text-green-200">{approved}</div>
          </div>
          <h3 className="text-sm font-medium text-white/80">Approved</h3>
          <p className="text-xs text-white/60 mt-1">{approvalRate}% Approval Rate</p>
        </div>

        <div className="text-center">
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-3">
            <div className="text-3xl font-bold text-red-200">{denied}</div>
          </div>
          <h3 className="text-sm font-medium text-white/80">Denied</h3>
          <p className="text-xs text-white/60 mt-1">Not Approved</p>
        </div>
      </div>
    </div>
  )
}

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
    <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.15)] relative">
      {expiringSoon > 0 && (
        <div className="absolute -top-3 -right-3 bg-orange-500/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-orange-400/50 animate-glass-fade-in">
          {expiringSoon} expiring soon
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Removed Items</h3>
        <p className="text-sm text-white/60">Archived & Deleted Requests</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-orange-500/15 backdrop-blur-sm rounded-xl border border-orange-400/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
            <span className="text-sm font-medium text-white/90">Archived</span>
          </div>
          <span className="text-xl font-bold text-orange-200">{archived}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-500/15 backdrop-blur-sm rounded-xl border border-red-400/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-sm font-medium text-white/90">Deleted</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-red-200">{deleted}</span>
            {expiringSoon > 0 && (
              <span className="text-xs bg-orange-500/50 text-white px-2 py-0.5 rounded-full font-medium">
                {expiringSoon} expiring
              </span>
            )}
          </div>
        </div>

        {hasAnyRemoved && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">Total Removed</span>
              <span className="text-2xl font-bold text-white">{totalRemoved}</span>
            </div>
          </div>
        )}

        {!hasAnyRemoved && (
          <div className="text-center py-4 text-white/50 font-medium">
            No archived or deleted items
          </div>
        )}
      </div>
    </div>
  )
}

function DaysOffCard({
  approvedDays
}: {
  approvedDays: number
}) {
  return (
    <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
      <div className="text-center">
        <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-6 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-400/20 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="text-4xl font-bold text-purple-200 mb-1">{approvedDays}</div>
            <div className="text-sm font-medium text-purple-300">Days</div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">This Month</h3>
        <p className="text-sm text-white/60">Approved Days Off</p>

        {approvedDays > 0 && (
          <div className="mt-3 text-xs text-white/50">
            Team productivity impact
          </div>
        )}
      </div>
    </div>
  )
}
