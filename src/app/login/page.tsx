import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const githubEnabled =
    !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  const registrationEnabled = process.env.ALLOW_REGISTRATION === "true";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
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
