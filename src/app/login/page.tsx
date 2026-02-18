"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Loader2 } from "lucide-react";
import Image from "next/image";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Card className="glass-card w-full max-w-sm">
      <CardHeader className="flex flex-col items-center text-center">
        <Image
          src="/logo_mybmad.png"
          alt="MyBMAD"
          width={64}
          height={64}
          className="mb-2"
        />
        <CardTitle className="text-2xl font-bold">MyBMAD</CardTitle>
        <CardDescription>
          Sign in to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
            Sign in failed. Please try again.
          </div>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            authClient.signIn.social({
              provider: "github",
              callbackURL: "/",
            });
          }}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Github className="mr-2 h-5 w-5" />
          )}
          Sign in with GitHub
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="fixed bottom-4 text-xs text-muted-foreground">
        Made with ❤️ by Hichem
      </p>
    </div>
  );
}
