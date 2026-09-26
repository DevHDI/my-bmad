import { DocsBrowser, type DocsSource } from "@/components/docs/docs-browser";
import type { FileTreeNode } from "@/lib/bmad/types";
import type { ProjectViewBaseProps } from "./types";

export interface ProjectDocsFiles {
  fileTree: FileTreeNode[];
  docsTree: FileTreeNode[];
  bmadCoreTree: FileTreeNode[];
}

type ProjectDocsViewProps = ProjectViewBaseProps & {
  source: DocsSource;
  initialSelectedFile?: string;
} & (
    | { files: ProjectDocsFiles; error?: undefined }
    | { files?: undefined; error: string }
  );

function treeContainsPath(nodes: FileTreeNode[], path: string): boolean {
  return nodes.some(
    (node) =>
      node.path === path ||
      (node.children !== undefined && treeContainsPath(node.children, path)),
  );
}

function LibraryHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Library</h1>
      <p className="text-muted-foreground mt-1">
        Browse the project files
      </p>
    </div>
  );
}

export function ProjectDocsView({
  mode,
  source,
  initialSelectedFile,
  files,
  error,
}: ProjectDocsViewProps) {
  if (!files) {
    return (
      <div className="space-y-8 pb-8">
        <LibraryHeader />
        <div
          className="flex items-center justify-center h-64 text-muted-foreground"
          role="alert"
        >
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Guest: never send the BMAD core tree to the client, nor preselect one of its files.
  const isGuest = mode === "guest";
  const selectedFile =
    isGuest &&
    initialSelectedFile !== undefined &&
    treeContainsPath(files.bmadCoreTree, initialSelectedFile)
      ? undefined
      : initialSelectedFile;

  return (
    <div className="space-y-8 pb-8">
      <LibraryHeader />
      <DocsBrowser
        fileTree={files.fileTree}
        docsTree={files.docsTree}
        bmadCoreTree={isGuest ? [] : files.bmadCoreTree}
        source={source}
        showBmadCore={!isGuest}
        initialSelectedFile={selectedFile}
      />
    </div>
  );
}
