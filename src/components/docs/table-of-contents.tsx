"use client";

import { useState, useMemo, useId } from "react";
import { ChevronDown, List } from "lucide-react";

interface TocEntry {
  level: number;
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractHeadings(markdown: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2]
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")  // [text](url) → text
        .replace(/\*\*|__|~~|`/g, "")               // bold, strikethrough, code
        .replace(/(?<!\*)\*(?!\*)/g, "")             // single * (italic)
        .trim();
      headings.push({ level, text, slug: slugify(text) });
    }
  }

  return headings;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [open, setOpen] = useState(false);
  const tocId = useId();
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length < 3) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="glass-card mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
        aria-expanded={open}
        aria-controls={`toc-${tocId}`}
      >
        <List className="size-4" />
        <span>{open ? "Table of Contents" : "Contents"}</span>
        <ChevronDown
          className={`ml-auto size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <nav id={`toc-${tocId}`} className="px-4 pb-4" aria-label="Table of Contents">
          <ul className="space-y-1">
            {headings.map((heading, i) => {
              const depth = heading.level - minLevel;
              const indentClass = depth === 1 ? "pl-4" : depth >= 2 ? "pl-8" : "";
              return (
                <li key={`${heading.slug}-${i}`} className={indentClass}>
                  <a
                    href={`#${heading.slug}`}
                    className="block text-sm text-muted-foreground hover:text-foreground py-0.5 transition-colors duration-300"
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
