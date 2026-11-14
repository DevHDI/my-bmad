"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { FileTree } from "./file-tree";
import { MarkdownRenderer } from "./markdown-renderer";
import { TableOfContents } from "./table-of-contents";
import { FileMetadataBar } from "./file-metadata-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import {
  FileText,
  FolderOpen,
  Cog,
  AlertTriangle,
  FileOutput,
  Settings,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { fetchParsedFileContent } from "@/actions/repo-actions";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import jsonLang from "highlight.js/lib/languages/json";
import type { FileTreeNode, ParsedBmadFile } from "@/lib/bmad/types";

/**
 * Where document contents are loaded from. Extensible union: new kinds
 * (e.g. a shared snapshot) add a branch in `loadParsedFile`.
 */
export type DocsSource = { kind: "owner"; owner: string; repo: string };

export function loadParsedFile(source: DocsSource, path: string) {
  switch (source.kind) {
    case "owner":
      return fetchParsedFileContent({
        owner: source.owner,
        name: source.repo,
        path,
      });
  }
}

hljs.registerLanguage("yaml", yamlLang);
hljs.registerLanguage("json", jsonLang);

function CodeRenderer({
  content,
  language,
}: {
  content: string;
  language: string;
}) {
  const html = useMemo(() => {
    if (!hljs.getLanguage(language)) {
      return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    try {
      return hljs.highlight(content, { language }).value;
    } catch {
      return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [content, language]);

  return (
    <pre className="hljs rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-1.5 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors duration-300"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{title}</span>
      </button>
      <div className="mt-0.5" style={{ display: open ? "block" : "none" }}>
        {children}
      </div>
    </div>
  );
}

function treeContainsPath(nodes: FileTreeNode[], path: string): boolean {
  for (const node of nodes) {
    if (node.path === path) return true;
    if (node.children && treeContainsPath(node.children, path)) return true;
  }
  return false;
}

function FilePanel({
  fileTree,
  secondaryTree,
  source,
  initialSelectedFile,
}: {
  fileTree: FileTreeNode[];
  secondaryTree?: FileTreeNode[];
  source: DocsSource;
  initialSelectedFile?: string;
}) {
  // Key the effect on the source value, not its object identity, so a
  // re-rendered parent does not reload the selected file.
  const sourceKey = JSON.stringify(source);
  const stableSource = useMemo<DocsSource>(
    () => JSON.parse(sourceKey) as DocsSource,
    [sourceKey],
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialSelectedFile ?? null,
  );
  const [parsedFile, setParsedFile] = useState<ParsedBmadFile | null>(null);
  const [loading, setLoading] = useState(!!initialSelectedFile);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!selectedPath) return;

    let cancelled = false;

    loadParsedFile(stableSource, selectedPath)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setParsedFile(result.data);
          setError(null);
        } else {
          setParsedFile(null);
          setError(result.error);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setParsedFile(null);
        setError("Failed to load file content.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPath, stableSource]);

  const hasSecondary = secondaryTree && secondaryTree.length > 0;
  const initialInSecondary =
    hasSecondary && initialSelectedFile
      ? treeContainsPath(secondaryTree, initialSelectedFile)
      : false;
  const isEmpty = fileTree.length === 0 && !hasSecondary;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <FolderOpen className="h-12 w-12 opacity-30" />
        <p>No files found</p>
      </div>
    );
  }

  return (
    <StaggeredList className="flex gap-4 h-[calc(100vh-17rem)]" staggerDelay={0.1}>
      <StaggeredItem>
      <Card className="glass-card w-64 shrink-0 overflow-hidden h-full">
        <ScrollArea className="h-full p-3 [&_[data-slot=scroll-area-viewport]>div]:block!">
          {hasSecondary ? (
            <div className="space-y-2">
              <CollapsibleSection
                title="Project Artifacts"
                icon={FileOutput}
                defaultOpen
              >
                <FileTree
                  nodes={fileTree}
                  selectedPath={selectedPath || undefined}
                  onSelect={handleSelect}
                />
              </CollapsibleSection>
              <Separator />
              <CollapsibleSection
                title="BMAD Configuration"
                icon={Settings}
                defaultOpen={initialInSecondary}
              >
                <FileTree
                  nodes={secondaryTree}
                  selectedPath={selectedPath || undefined}
                  onSelect={handleSelect}
                />
              </CollapsibleSection>
            </div>
          ) : (
            <FileTree
              nodes={fileTree}
              selectedPath={selectedPath || undefined}
              onSelect={handleSelect}
            />
          )}
        </ScrollArea>
      </Card>
      </StaggeredItem>

      <StaggeredItem className="flex-1">
      <Card className="glass-card overflow-hidden h-full">
        <ScrollArea className="h-full p-6">
          <div aria-live="polite">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-3"
                role="alert"
              >
                {error.includes("Limite") ? (
                  <Badge
                    variant="outline"
                    className="gap-1.5 text-warning-foreground border-warning/30"
                  >
                    <AlertTriangle className="size-3.5" />
                    GitHub rate limit reached. Cached data is displayed.
                  </Badge>
                ) : (
                  <p className="text-destructive text-sm">{error}</p>
                )}
              </div>
            ) : selectedPath && parsedFile ? (
              <>
                {parsedFile.metadata && (
                  <FileMetadataBar metadata={parsedFile.metadata} />
                )}
                {parsedFile.parseError ? (
                  <>
                    <div
                      className="mb-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm"
                      role="alert"
                    >
                      <div className="flex items-center gap-2 text-warning-foreground font-medium">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        This file contains syntax errors. Raw content is
                        displayed below.
                      </div>
                      <p className="mt-2 text-xs font-mono text-muted-foreground">
                        {parsedFile.parseError}
                      </p>
                    </div>
                    <CodeRenderer
                      content={parsedFile.body}
                      language={
                        parsedFile.contentType === "yaml"
                          ? "yaml"
                          : parsedFile.contentType === "json"
                            ? "json"
                            : "plaintext"
                      }
                    />
                  </>
                ) : parsedFile.contentType === "markdown" ? (
                  <>
                    <TableOfContents content={parsedFile.body} />
                    <MarkdownRenderer content={parsedFile.body} />
                  </>
                ) : parsedFile.contentType === "yaml" ? (
                  <CodeRenderer content={parsedFile.body} language="yaml" />
                ) : parsedFile.contentType === "json" ? (
                  <CodeRenderer content={parsedFile.body} language="json" />
                ) : (
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {parsedFile.body}
                  </pre>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <FileText className="h-12 w-12 opacity-30" />
                <p>Select a file from the tree to view its content</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
      </StaggeredItem>
    </StaggeredList>
  );
}

interface DocsBrowserProps {
  fileTree: FileTreeNode[];
  docsTree: FileTreeNode[];
  bmadCoreTree: FileTreeNode[];
  source: DocsSource;
  /** Show the BMAD core (`_bmad/`) tree. Defaults to true. */
  showBmadCore?: boolean;
  initialSelectedFile?: string;
}

export function DocsBrowser({
  fileTree,
  docsTree,
  bmadCoreTree: rawBmadCoreTree,
  source,
  showBmadCore = true,
  initialSelectedFile,
}: DocsBrowserProps) {
  const bmadCoreTree = showBmadCore ? rawBmadCoreTree : [];
  const hasDocs = docsTree.length > 0;
  const hasBmad = fileTree.length > 0 || bmadCoreTree.length > 0;

  // If only one source exists, no tabs needed
  if (!hasDocs) {
    return (
      <FilePanel
        fileTree={fileTree}
        secondaryTree={bmadCoreTree.length > 0 ? bmadCoreTree : undefined}
        source={source}
        initialSelectedFile={initialSelectedFile}
      />
    );
  }

  if (!hasBmad) {
    return (
      <FilePanel
        fileTree={docsTree}
        source={source}
        initialSelectedFile={initialSelectedFile}
      />
    );
  }

  // Determine which tab should be active based on initialSelectedFile location
  const initialInDocs =
    initialSelectedFile && treeContainsPath(docsTree, initialSelectedFile);
  const defaultTab = initialInDocs ? "docs" : "bmad";

  // Both exist — show tabs
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="bmad" className="gap-1.5">
          <Cog className="size-4" />
          BMAD Artifacts
        </TabsTrigger>
        <TabsTrigger value="docs" className="gap-1.5">
          <FolderOpen className="size-4" />
          Project Documentation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bmad" className="mt-4">
        <FilePanel
          fileTree={fileTree}
          secondaryTree={bmadCoreTree.length > 0 ? bmadCoreTree : undefined}
          source={source}
          initialSelectedFile={initialInDocs ? undefined : initialSelectedFile}
        />
      </TabsContent>

      <TabsContent value="docs" className="mt-4">
        <FilePanel
          fileTree={docsTree}
          source={source}
          initialSelectedFile={initialInDocs ? initialSelectedFile : undefined}
        />
      </TabsContent>
    </Tabs>
  );
}
