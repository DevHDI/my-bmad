import { redirect, notFound } from "next/navigation";
import { DocsBrowser } from "@/components/docs/docs-browser";
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

  if (!result.success) {
    return (
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse the project files
          </p>
        </div>
        <div
          className="flex items-center justify-center h-64 text-muted-foreground"
          role="alert"
        >
          <p>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse the project files
        </p>
      </div>
      <DocsBrowser
        fileTree={result.data.fileTree}
        docsTree={result.data.docsTree}
        bmadCoreTree={result.data.bmadCoreTree}
        owner={owner}
        repo={repoName}
        initialSelectedFile={initialFile}
      />
    </div>
  );
}
