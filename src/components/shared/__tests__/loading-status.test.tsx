import { renderToStaticMarkup } from "react-dom/server";
import { LoadingStatus } from "@/components/shared/loading-status";
import { Skeleton } from "@/components/ui/skeleton";

describe("LoadingStatus", () => {
  it("announces a busy status with a screen-reader label", () => {
    const html = renderToStaticMarkup(
      <LoadingStatus className="space-y-6">
        <Skeleton className="h-8 w-32" />
      </LoadingStatus>,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('class="space-y-6"');
    expect(html).toContain('<span class="sr-only">Loading…</span>');
  });

  it("accepts a custom label", () => {
    const html = renderToStaticMarkup(<LoadingStatus label="Loading stories…">x</LoadingStatus>);

    expect(html).toContain('<span class="sr-only">Loading stories…</span>');
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technologies", () => {
    expect(renderToStaticMarkup(<Skeleton />)).toContain('aria-hidden="true"');
  });
});
