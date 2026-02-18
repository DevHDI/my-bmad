"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (React.isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    return extractTextFromChildren(props.children as React.ReactNode);
  }
  return "";
}

export function CodeBlockWithCopy(props: React.ComponentProps<"pre">) {
  const { children, ...rest } = props;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement =>
      React.isValidElement(child) && child.type === "code"
  );

  const codeProps = codeElement?.props as Record<string, unknown> | undefined;
  const className = (codeProps?.className as string) || "";
  const langMatch = className.match(/language-(\S+)/);
  const language = langMatch ? langMatch[1] : "";

  const codeText = codeElement
    ? extractTextFromChildren(codeProps?.children as React.ReactNode)
    : "";

  const handleCopy = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await navigator.clipboard.writeText(codeText);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    timerRef.current = setTimeout(() => setCopyState("idle"), 2000);
  }, [codeText]);

  return (
    <div className="group/code relative" role="region" aria-label={`Bloc de code${language ? ` ${language}` : ""}`}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover/code:opacity-100 transition-opacity duration-300">
        {language && (
          <Badge variant="secondary" className="text-xs font-mono px-1.5 py-0.5">
            {language}
          </Badge>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center size-7 rounded-md bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors duration-300"
          aria-label="Copier le code"
        >
          {copyState === "copied" ? (
            <Check className="size-3.5 text-green-500" />
          ) : copyState === "error" ? (
            <XCircle className="size-3.5 text-red-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      <pre {...rest}>{children}</pre>
    </div>
  );
}
