import { headers } from "next/headers";
import { getDomainMoveNotice } from "@/lib/domain-move";
import { cn } from "@/lib/utils";

interface DomainMoveBannerProps {
  className?: string;
}

// Rendered by each layout rather than the root one: the dashboard sidebar is
// position: fixed and would cover a banner placed above it.
export async function DomainMoveBanner({ className }: DomainMoveBannerProps) {
  const requestHeaders = await headers();
  const notice = getDomainMoveNotice(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  if (!notice) return null;

  return (
    <div
      role="status"
      className={cn(
        "border border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning-foreground",
        className,
      )}
    >
      MyBMAD is moving to{" "}
      <a
        href={notice.url}
        className="font-medium underline underline-offset-4"
      >
        {notice.host}
      </a>
      {notice.date ? ` on ${notice.date}` : ""}. Update your bookmarks — you
      will need to sign in with GitHub once on the new address. Your account
      and projects stay the same.
    </div>
  );
}
