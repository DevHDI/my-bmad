import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { DomainMoveBanner } from "@/components/shared/domain-move-banner";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const githubEnabled =
    !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  const registrationEnabled = process.env.ALLOW_REGISTRATION === "true";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <DomainMoveBanner className="fixed inset-x-0 top-0 border-x-0 border-t-0" />
      <Suspense>
        <LoginForm
          githubEnabled={githubEnabled}
          registrationEnabled={registrationEnabled}
        />
      </Suspense>
      <p className="fixed bottom-4 text-xs text-muted-foreground">
        Made with ❤️ by Hichem
      </p>
    </div>
  );
}
