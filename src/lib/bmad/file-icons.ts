import { createElement } from "react";
import { FileText, FileCode, FileJson, FileType, FileSpreadsheet } from "lucide-react";

type LucideIcon = React.ComponentType<{ className?: string }>;

interface FileIconDef {
  icon: LucideIcon;
  color: string;
}

const EXTENSION_ICONS: Record<string, FileIconDef> = {
  md: { icon: FileText, color: "text-sky-500" },
  mdx: { icon: FileText, color: "text-sky-500" },
  yaml: { icon: FileCode, color: "text-amber-500" },
  yml: { icon: FileCode, color: "text-amber-500" },
  json: { icon: FileJson, color: "text-emerald-500" },
  csv: { icon: FileSpreadsheet, color: "text-green-500" },
  ts: { icon: FileType, color: "text-blue-500" },
  tsx: { icon: FileType, color: "text-blue-500" },
  js: { icon: FileType, color: "text-yellow-500" },
  jsx: { icon: FileType, color: "text-yellow-500" },
};

const DEFAULT_ICON: FileIconDef = { icon: FileText, color: "text-muted-foreground" };

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

export function renderFileIcon(fileName: string, className?: string) {
  const ext = getExtension(fileName);
  const def = EXTENSION_ICONS[ext] ?? DEFAULT_ICON;
  // Replace text-muted-foreground from caller className with the icon's own color
  const baseClass = className?.replace(/text-[\w-/]+/g, "").trim() ?? "";
  return createElement(def.icon, { className: `${baseClass} ${def.color}`.trim() });
}
