import { Users, FolderGit2, UserPlus, Activity, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import type { UsageMetrics as UsageMetricsData } from "@/actions/admin-actions";

export function UsageMetrics({
  totalUsers,
  totalRepos,
  recentUsers,
  activeUsersLast30d,
  parsingErrorRate,
}: UsageMetricsData) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatsCard
        title="Total Users"
        value={totalUsers}
        icon={Users}
        color="violet"
      />
      <StatsCard
        title="Connected Repos"
        value={totalRepos}
        icon={FolderGit2}
        color="blue"
      />
      <StatsCard
        title="Recent Users"
        value={recentUsers}
        description="Last 7 days"
        icon={UserPlus}
        color="emerald"
      />
      <StatsCard
        title="Active Users"
        value={activeUsersLast30d}
        description="Last 30 days"
        icon={Activity}
        color="amber"
      />
      <StatsCard
        title="Parsing Errors"
        value={`${parsingErrorRate}%`}
        description="Target KPI: < 1%"
        icon={AlertTriangle}
        color="rose"
      />
    </div>
  );
}
