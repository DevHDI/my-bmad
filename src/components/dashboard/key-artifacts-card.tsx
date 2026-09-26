import Link from "next/link";
import { BookOpen } from "lucide-react";
import { renderFileIcon } from "@/lib/bmad/file-icons";
import type { FileTreeNode } from "@/lib/bmad/types";

function flattenFiles(nodes: FileTreeNode[]): FileTreeNode[] {
  const files: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      files.push(node);
    }
    if (node.children) {
      files.push(...flattenFiles(node.children));
    }
  }
  return files;
}

interface KeyArtifactsCardProps {
  planningArtifacts: FileTreeNode[];
  /** Project root URL (e.g. `/repo/owner/repo`). */
  basePath: string;
}

export function KeyArtifactsCard({
  planningArtifacts,
  basePath,
}: KeyArtifactsCardProps) {
  const files = flattenFiles(planningArtifacts);

  if (files.length === 0) return null;

  return (
    <section className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Key Files</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {files.map((file) => (
            <Link
              key={file.path}
              href={`${basePath}/docs?file=${encodeURIComponent(file.path)}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors duration-300"
            >
              {renderFileIcon(file.name, "h-4 w-4 shrink-0 text-muted-foreground")}
              <span className="truncate">{file.name}</span>
            </Link>
        ))}
      </div>
    </section>
  );
}
