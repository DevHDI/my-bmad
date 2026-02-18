"use client";

import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function RepoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const is404 = error.message?.includes("404");
  const isAuthError = error.message?.includes("401") || error.message?.includes("403");

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="glass-card max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {is404
                ? "Repository not found"
                : isAuthError
                  ? "Authentication required"
                  : "Failed to load project"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {is404
                ? "The repository does not exist or is private. Reconnect via GitHub to renew your OAuth authorization."
                : isAuthError
                  ? "Your GitHub token is invalid or lacks the required permissions. Try reconnecting."
                  : error.message || "An unexpected error occurred while loading the project data."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button onClick={() => reset()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
