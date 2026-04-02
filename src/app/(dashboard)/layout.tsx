import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { redirect } from "next/navigation";
import {
  getAuthenticatedSession,
  getAuthenticatedRepos,
} from "@/lib/db/helpers";
import { getGitHubToken } from "@/lib/github/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const repos = await getAuthenticatedRepos(session.userId);

  const localFsEnabled = process.env.ENABLE_LOCAL_FS === "true";
  const hasGitHubOAuth =
    !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  const hasGitHubToken = hasGitHubOAuth
    ? !!(await getGitHubToken(session.userId))
    : false;

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar
          repos={repos}
          userRole={session.role}
          localFsEnabled={localFsEnabled}
          githubEnabled={hasGitHubToken}
        />
        <SidebarInset>
          <AppHeader />
          <div className="flex-1 pt-4 pr-4 pb-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
