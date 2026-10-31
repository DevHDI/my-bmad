import type { DomainMoveNotice } from "@/lib/domain-move";

interface DomainMoveBannerProps {
  notice: DomainMoveNotice;
}

export function DomainMoveBanner({ notice }: DomainMoveBannerProps) {
  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning-foreground"
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
