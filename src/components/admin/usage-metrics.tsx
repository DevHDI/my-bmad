import { Users, FolderGit2, UserPlus, Activity, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import type { UsageMetrics as UsageMetricsData } from "@/actions/admin-actions";

export function UsageMetrics({
  totalUsers,
  totalRepos,
  recentUsers,
  activeUsersLast30d,
  parsingErrorRate,
}: UsageMetricsData) {
  return (
    <StaggeredList className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StaggeredItem>
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="violet"
        />
      </StaggeredItem>
      <StaggeredItem>
        <StatsCard
          title="Connected Repos"
          value={totalRepos}
          icon={FolderGit2}
          color="info"
        />
      </StaggeredItem>
      <StaggeredItem>
        <StatsCard
          title="Recent Users"
          value={recentUsers}
          description="Last 7 days"
          icon={UserPlus}
          color="success"
        />
      </StaggeredItem>
      <StaggeredItem>
        <StatsCard
          title="Active Users"
          value={activeUsersLast30d}
          description="Last 30 days"
          icon={Activity}
          color="warning"
        />
      </StaggeredItem>
      <StaggeredItem>
        <StatsCard
          title="Parsing Errors"
          value={parsingErrorRate === null ? "N/A" : `${parsingErrorRate}%`}
          description={
            parsingErrorRate === null
              ? "Not yet tracked"
              : "Target KPI: < 1%"
          }
          icon={AlertTriangle}
          color="destructive"
        />
      </StaggeredItem>
    </StaggeredList>
  );
}
