import { describe, expect, it } from "vitest";
import { buildIssueUrl, issuesUrl, REPORT_WRONG_NUMBER_URL, SITE } from "@/config/site";

describe("issue links", () => {
  it("derives the new-issue URL from the repo URL", () => {
    expect(issuesUrl).toBe(`${SITE.githubUrl}/issues/new`);
  });

  it("encodes the title and body as query parameters", () => {
    const body = "a & b = c?\nnext #line";
    const url = buildIssueUrl("Wrong number: ", body);
    expect(url).toBe(
      `${issuesUrl}?title=Wrong%20number%3A%20&body=a%20%26%20b%20%3D%20c%3F%0Anext%20%23line`,
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("title")).toBe("Wrong number: ");
    expect(parsed.searchParams.get("body")).toBe(body);
  });

  it("pre-fills the wrong-number report with the four questions", () => {
    const parsed = new URL(REPORT_WRONG_NUMBER_URL);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(issuesUrl);
    expect(parsed.searchParams.get("title")).toBe("Wrong number: ");
    const body = parsed.searchParams.get("body") ?? "";
    expect(body).toContain("Which figure is wrong?");
    expect(body).toContain(`What ${SITE.name} shows`);
    expect(body).toContain("What the vibe/vibe app or docs show");
    expect(body).toContain("Link or screenshot");
    expect(REPORT_WRONG_NUMBER_URL).not.toMatch(/\s/);
  });
});
