"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Lock,
  Globe,
  FolderGit2,
  FolderOpen,
  Loader2,
  Github,
} from "lucide-react";
import {
  listUserRepos,
  detectBmadRepos,
  importRepo,
  importLocalFolder,
} from "@/actions/repo-actions";
import type { GitHubRepo } from "@/lib/github/types";

interface AddRepoDialogProps {
  trigger?: React.ReactNode;
  importedRepos?: { owner: string; name: string }[];
  localFsEnabled?: boolean;
  githubEnabled?: boolean;
}

export function AddRepoDialog({
  trigger,
  importedRepos = [],
  localFsEnabled = false,
  githubEnabled = true,
}: AddRepoDialogProps) {
  const importedSet = useMemo(
    () => new Set(importedRepos.map((r) => `${r.owner}/${r.name}`)),
    [importedRepos]
  );
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const [importError, setImportError] = useState("");

  // Local folder state
  const [localPath, setLocalPath] = useState("");
  const [localImporting, setLocalImporting] = useState(false);
  const [localError, setLocalError] = useState("");

  const defaultTab = githubEnabled ? "github" : "local";

  const fetchRepos = useCallback(async () => {
    if (!githubEnabled) return;
    setLoading(true);
    setError("");
    setRepos([]);
    setSearch("");
    setDetecting(false);

    const result = await listUserRepos();
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setRepos(result.data);
    setLoading(false);

    if (result.data.length > 0) {
      setDetecting(true);
      const ids = result.data.map((r) => ({
        fullName: r.fullName,
        owner: r.owner,
        name: r.name,
      }));

      const bmadResult = await detectBmadRepos(ids);
      if (bmadResult.success) {
        setRepos((prev) => {
          const updated = prev.map((r) => ({
            ...r,
            hasBmad: bmadResult.data[r.fullName] ?? false,
          }));
          updated.sort((a, b) => {
            if (a.hasBmad !== b.hasBmad) return a.hasBmad ? -1 : 1;
            return (
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
            );
          });
          return updated;
        });
      }
      setDetecting(false);
    }
  }, [githubEnabled]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && githubEnabled) {
      fetchRepos();
    }
    if (!nextOpen) {
      setLocalPath("");
      setLocalError("");
      setLocalImporting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [repos, search]);

  async function handleSelectRepo(repo: GitHubRepo) {
    setImporting(repo.fullName);
    setImportError("");

    const result = await importRepo({
      owner: repo.owner,
      name: repo.name,
      description: repo.description,
      defaultBranch: repo.defaultBranch,
      fullName: repo.fullName,
    });

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setImportError(result.error);
    }
    setImporting(null);
  }

  async function handleImportLocal(e: React.FormEvent) {
    e.preventDefault();
    if (!localPath.trim()) return;

    setLocalImporting(true);
    setLocalError("");

    const result = await importLocalFolder({ localPath: localPath.trim() });

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setLocalError(result.error);
    }
    setLocalImporting(false);
  }

  const showTabs = githubEnabled && localFsEnabled;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a project</DialogTitle>
        </DialogHeader>

        {showTabs ? (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full">
              <TabsTrigger value="github" className="flex-1">
                <Github className="mr-1.5 h-4 w-4" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="local" className="flex-1">
                <FolderOpen className="mr-1.5 h-4 w-4" />
                Local Folder
              </TabsTrigger>
            </TabsList>
            <TabsContent value="github">
              <GitHubRepoList
                search={search}
                setSearch={setSearch}
                loading={loading}
                detecting={detecting}
                error={error}
                importError={importError}
                filtered={filtered}
                importing={importing}
                importedSet={importedSet}
                onSelect={handleSelectRepo}
              />
            </TabsContent>
            <TabsContent value="local">
              <LocalFolderForm
                localPath={localPath}
                setLocalPath={setLocalPath}
                localImporting={localImporting}
                localError={localError}
                onSubmit={handleImportLocal}
              />
            </TabsContent>
          </Tabs>
        ) : localFsEnabled ? (
          <LocalFolderForm
            localPath={localPath}
            setLocalPath={setLocalPath}
            localImporting={localImporting}
            localError={localError}
            onSubmit={handleImportLocal}
          />
        ) : (
          <GitHubRepoList
            search={search}
            setSearch={setSearch}
            loading={loading}
            detecting={detecting}
            error={error}
            importError={importError}
            filtered={filtered}
            importing={importing}
            importedSet={importedSet}
            onSelect={handleSelectRepo}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GitHubRepoList({
  search,
  setSearch,
  loading,
  detecting,
  error,
  importError,
  filtered,
  importing,
  importedSet,
  onSelect,
}: {
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  detecting: boolean;
  error: string;
  importError: string;
  filtered: GitHubRepo[];
  importing: string | null;
  importedSet: Set<string>;
  onSelect: (repo: GitHubRepo) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search for a repository..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          disabled={loading}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {importError && <p className="text-destructive text-sm">{importError}</p>}
      {detecting && (
        <p className="text-muted-foreground text-xs animate-pulse">
          Detecting BMAD files...
        </p>
      )}

      <ScrollArea className="h-80">
        {loading ? (
          <div className="space-y-3 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {filtered.length === 0 && !error && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {search ? "No repository found" : "No repository available"}
              </p>
            )}
            {filtered.map((repo) => {
              const isImporting = importing === repo.fullName;
              const isAlreadyImported = importedSet.has(
                `${repo.owner}/${repo.name}`
              );
              const isDisabled = importing !== null || isAlreadyImported;

              return (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => onSelect(repo)}
                  disabled={isDisabled}
                  className="hover:bg-accent flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:pointer-events-none disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <FolderGit2 className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {repo.fullName}
                      </span>
                      {isAlreadyImported && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Imported
                        </Badge>
                      )}
                      {repo.hasBmad && !isAlreadyImported && (
                        <Badge variant="default" className="shrink-0 text-xs">
                          BMAD
                        </Badge>
                      )}
                      {repo.isPrivate ? (
                        <Lock className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Globe className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs [text-wrap:auto]">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function LocalFolderForm({
  localPath,
  setLocalPath,
  localImporting,
  localError,
  onSubmit,
}: {
  localPath: string;
  setLocalPath: (v: string) => void;
  localImporting: boolean;
  localError: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter the absolute path to a local folder containing{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">_bmad/</code>{" "}
          or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            _bmad-output/
          </code>
          .
        </p>
        <Input
          placeholder="/home/user/my-project"
          value={localPath}
          onChange={(e) => setLocalPath(e.target.value)}
          disabled={localImporting}
          autoComplete="off"
        />
      </div>

      {localError && (
        <p className="text-destructive text-sm">{localError}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={localImporting || !localPath.trim()}
      >
        {localImporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FolderOpen className="mr-2 h-4 w-4" />
        )}
        Import local folder
      </Button>
    </form>
  );
}
