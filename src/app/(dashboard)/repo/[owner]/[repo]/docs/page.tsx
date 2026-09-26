import { redirect, notFound } from "next/navigation";
import { ProjectDocsView } from "@/components/project-views/project-docs-view";
import { fetchBmadFiles } from "@/actions/repo-actions";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface DocsPageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ file?: string }>;
}

export default async function DocsPage({
  params,
  searchParams,
}: DocsPageProps) {
  const { owner, repo: repoName } = await params;
  const { file: initialFile } = await searchParams;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const result = await fetchBmadFiles({ owner, name: repoName });
  const viewProps = {
    basePath: `/repo/${owner}/${repoName}`,
    mode: "owner" as const,
    source: { kind: "owner" as const, owner, repo: repoName },
    initialSelectedFile: initialFile,
  };

  if (!result.success) {
    return <ProjectDocsView {...viewProps} error={result.error} />;
  }

  return (
    <ProjectDocsView
      {...viewProps}
      files={{
        fileTree: result.data.fileTree,
        docsTree: result.data.docsTree,
        bmadCoreTree: result.data.bmadCoreTree,
      }}
    />
  );
}
