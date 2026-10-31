import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { DomainMoveBanner } from "@/components/shared/domain-move-banner";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const githubEnabled =
    !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  const registrationEnabled = process.env.ALLOW_REGISTRATION === "true";

  return (
    <div className="flex min-h-screen flex-col">
      <DomainMoveBanner className="border-x-0 border-t-0" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <Suspense>
          <LoginForm
            githubEnabled={githubEnabled}
            registrationEnabled={registrationEnabled}
          />
        </Suspense>
      </div>
      <p className="fixed inset-x-0 bottom-4 text-center text-xs text-muted-foreground">
        Made with ❤️ by Hichem
      </p>
    </div>
  );
}
