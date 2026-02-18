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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Lock, Globe, FolderGit2, Loader2 } from "lucide-react";
import {
  listUserRepos,
  detectBmadRepos,
  importRepo,
} from "@/actions/repo-actions";
import type { GitHubRepo } from "@/lib/github/types";

interface AddRepoDialogProps {
  trigger?: React.ReactNode;
  importedRepos?: { owner: string; name: string }[];
}

export function AddRepoDialog({ trigger, importedRepos = [] }: AddRepoDialogProps) {
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

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError("");
    setRepos([]);
    setSearch("");
    setDetecting(false);

    // Phase 1: fetch repos (fast)
    const result = await listUserRepos();
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setRepos(result.data);
    setLoading(false);

    // Phase 2: detect BMAD in background
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
          // Re-sort: BMAD first, then by date
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
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchRepos();
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
          <DialogTitle>Add a repository</DialogTitle>
        </DialogHeader>

        {/* Search field */}
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

        {/* Error state */}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {importError && (
          <p className="text-destructive text-sm">{importError}</p>
        )}

        {/* BMAD detection indicator */}
        {detecting && (
          <p className="text-muted-foreground text-xs animate-pulse">
            Detecting BMAD files...
          </p>
        )}

        {/* Repo list */}
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
                  {search
                    ? "No repository found"
                    : "No repository available"}
                </p>
              )}
              {filtered.map((repo) => {
                const isImporting = importing === repo.fullName;
                const isAlreadyImported = importedSet.has(`${repo.owner}/${repo.name}`);
                const isDisabled = importing !== null || isAlreadyImported;

                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => handleSelectRepo(repo)}
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
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs"
                          >
                            Imported
                          </Badge>
                        )}
                        {repo.hasBmad && !isAlreadyImported && (
                          <Badge
                            variant="default"
                            className="shrink-0 text-xs"
                          >
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
      </DialogContent>
    </Dialog>
  );
}
