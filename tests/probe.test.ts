import { describe, expect, it } from "vitest";
import { buildAuthorizeProbeUrl, interpretProbe } from "@/lib/probe/oauth";

// Shapes recorded from real unauthenticated probes on 2026-10-28 (bodies trimmed).
const google = {
  kind: "authorize" as const,
  url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=oauth-guide-probe-invalid",
  status: 302,
  location:
    "https://accounts.google.com/signin/oauth/error?authError=Cg5pbnZhbGlkX2NsaWVudBIfVGhlIE9BdXRoIGNsaWVudCB3YXMgbm90IGZvdW5kLiCRAw&flowName=GeneralOAuthFlow",
};
const github = {
  kind: "authorize" as const,
  url: "https://github.com/login/oauth/authorize?client_id=oauth-guide-probe-invalid",
  status: 302,
  location: "https://github.com/login?client_id=oauth-guide-probe-invalid&return_to=%2Flogin%2Foauth%2Fauthorize",
};
const microsoft = {
  kind: "authorize" as const,
  url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=oauth-guide-probe-invalid",
  status: 200,
  body: "<html><head><title>Sign in to your account</title></head><body></body></html>",
};
const linkedin = {
  kind: "authorize" as const,
  url: "https://www.linkedin.com/oauth/v2/authorization?client_id=oauth-guide-probe-invalid",
  status: 200,
  body: "<html><title>LinkedIn</title><p>error</p><p>client_id is invalid &quot;oauth-guide-probe-invalid&quot;</p>",
};

describe("interpretProbe", () => {
  it("decodes Google's base64 authError as invalid_client", () => {
    expect(interpretProbe(google).summary).toBe(
      "Authorization endpoint at accounts.google.com is live and rejects an unknown client ID (invalid_client), as expected.",
    );
  });
  it("notes when sign-in comes before client validation (GitHub)", () => {
    expect(interpretProbe(github).summary).toMatch(/sends visitors to sign in at github\.com before it checks the client ID/);
  });
  it("recognizes a sign-in page (Microsoft)", () => {
    expect(interpretProbe(microsoft).summary).toMatch(/shows a sign-in page/);
  });
  it("finds a client error in the page body (LinkedIn)", () => {
    expect(interpretProbe(linkedin).summary).toMatch(/shows an error for an unknown client ID \(client_id is invalid\)/);
  });
  it("reads standard error params from a redirect", () => {
    const finding = interpretProbe({ ...github, location: "https://example.com/callback?error=unauthorized_client&state=probe" });
    expect(finding.summary).toMatch(/rejects an unknown client ID \(unauthorized_client\)/);
  });
  it("handles 404, 5xx, and network errors without overclaiming", () => {
    expect(interpretProbe({ ...linkedin, status: 404, body: "" }).summary).toMatch(/HTTP 404/);
    expect(interpretProbe({ ...linkedin, status: 503, body: "" }).ok).toBe(false);
    expect(interpretProbe({ ...linkedin, error: "timed out" }).summary).toBe("Could not reach www.linkedin.com: timed out.");
    expect(interpretProbe({ ...linkedin, body: "<title>Welcome</title>" }).summary).toMatch(/did not show/);
  });
  it("extracts endpoints and PKCE from a discovery document", () => {
    const finding = interpretProbe({
      kind: "discovery",
      url: "https://example.com/.well-known/openid-configuration",
      status: 200,
      body: JSON.stringify({
        authorization_endpoint: "https://example.com/authorize",
        token_endpoint: "https://example.com/token",
        code_challenge_methods_supported: ["S256", "plain"],
        scopes_supported: ["openid", "email"],
      }),
    });
    expect(finding).toMatchObject({ ok: true, authorizationEndpoint: "https://example.com/authorize", pkceMethods: ["S256", "plain"] });
    expect(finding.summary).toMatch(/PKCE methods listed: S256, plain/);
  });
  it("reports a missing discovery document", () => {
    const finding = interpretProbe({ kind: "discovery", url: "https://x.com/.well-known/openid-configuration", status: 404, body: "nope" });
    expect(finding).toMatchObject({ ok: false });
  });
  it("says when a portal needs sign-in", () => {
    const finding = interpretProbe({ kind: "portal", url: "https://api.slack.com/apps", status: 200, finalUrl: "https://slack.com/signin?redir=%2Fapps" });
    expect(finding.summary).toMatch(/^Developer portal at https:\/\/api\.slack\.com\/apps loads and asks you to sign in/);
  });
});

describe("buildAuthorizeProbeUrl", () => {
  it("adds the fake client and keeps existing params", () => {
    const url = new URL(buildAuthorizeProbeUrl("https://example.com/auth?prompt=consent", "read")!);
    expect(url.searchParams.get("client_id")).toBe("oauth-guide-probe-invalid");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("scope")).toBe("read");
  });
  it("rejects non-http URLs", () => {
    expect(buildAuthorizeProbeUrl("javascript:alert(1)")).toBeUndefined();
    expect(buildAuthorizeProbeUrl("not a url")).toBeUndefined();
  });
});
