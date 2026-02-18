"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  ChevronRight,
  Eye,
  Map,
  BookOpen,
  FileText,
  Shield,
} from "lucide-react";
import { Collapsible } from "radix-ui";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AddRepoDialog } from "@/components/layout/add-repo-dialog";
import { UserMenu } from "@/components/layout/user-menu";
import type { RepoConfig } from "@/lib/types";

interface AppSidebarProps {
  repos: RepoConfig[];
  userRole?: string;
}

const projectTabs = [
  { label: "Overview", segment: "", icon: Eye },
  { label: "Epics", segment: "epics", icon: Map },
  { label: "Stories", segment: "stories", icon: BookOpen },
  { label: "Library", segment: "docs", icon: FileText },
];

export function AppSidebar({ repos, userRole }: AppSidebarProps) {
  const pathname = usePathname();

  // Track which repo key is expanded — only one at a time
  const activeRepoKey = repos.find((r) =>
    pathname.startsWith(`/repo/${r.owner}/${r.name}`)
  );
  const [openRepo, setOpenRepo] = useState<string | null>(
    activeRepoKey ? `${activeRepoKey.owner}/${activeRepoKey.name}` : null
  );

  // Sync with route changes (e.g. navigating via links outside sidebar)
  useEffect(() => {
    const key = activeRepoKey ? `${activeRepoKey.owner}/${activeRepoKey.name}` : null;
    if (key) setOpenRepo(key);
  }, [activeRepoKey?.owner, activeRepoKey?.name]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="border-b border-border/50 px-6 py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_mybmad.png"
            alt="MyBMAD"
            width={32}
            height={32}
            className="shrink-0 rounded-lg"
          />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">MyBMAD</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Dashboard">
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <div className="group-data-[collapsible=icon]:hidden pr-2">
              <AddRepoDialog importedRepos={repos} />
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {repos.map((repo) => {
                const basePath = `/repo/${repo.owner}/${repo.name}`;
                const isRepoActive = pathname.startsWith(basePath);

                const repoKey = `${repo.owner}/${repo.name}`;

                return (
                  <Collapsible.Root
                    key={repoKey}
                    open={openRepo === repoKey}
                    onOpenChange={(open) => setOpenRepo(open ? repoKey : null)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <Collapsible.Trigger asChild>
                        <SidebarMenuButton isActive={isRepoActive} tooltip={repo.displayName}>
                          <FolderGit2 className="h-4 w-4" />
                          <span>{repo.displayName}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </Collapsible.Trigger>
                      <Collapsible.Content className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub>
                          {projectTabs.map((tab) => {
                            const tabHref = tab.segment
                              ? `${basePath}/${tab.segment}`
                              : basePath;
                            const isTabActive = tab.segment === ""
                              ? pathname === basePath || pathname === basePath + "/"
                              : pathname.startsWith(`${basePath}/${tab.segment}`);

                            return (
                              <SidebarMenuSubItem key={tab.segment || "overview"}>
                                <SidebarMenuSubButton asChild isActive={isTabActive}>
                                  <Link
                                    href={tabHref}
                                    onClick={() => {
                                      if (isTabActive) {
                                        window.dispatchEvent(new CustomEvent("section-reset"));
                                      }
                                    }}
                                  >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    <span>{tab.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </Collapsible.Content>
                    </SidebarMenuItem>
                  </Collapsible.Root>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {userRole === "admin" && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/admin")} tooltip="Administration">
                <Link href="/admin">
                  <Shield className="h-4 w-4" />
                  <span>Administration</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarFooter className="border-t border-border/50">
        <UserMenu />
        <div className="border-t border-border/50 pt-2 pb-1 text-center group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">Made with ❤️ by Hichem</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
