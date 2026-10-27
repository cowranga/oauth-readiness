import { describe, expect, it } from "vitest";
import { isBlockedIp, safeFetch, SafeFetchError } from "@/lib/net/safeFetch";

describe("isBlockedIp", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:a9fe:a9fe", "::7f00:1", "2002:7f00:1::", "64:ff9b::1", "192.0.2.1", "203.0.113.5", "not-an-ip"])(
    "blocks %s",
    (ip) => expect(isBlockedIp(ip)).toBe(true),
  );
  it.each(["8.8.8.8", "172.32.0.1", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8", "::ffff:808:808", "2001:4860:4860::8888"])("allows %s", (ip) =>
    expect(isBlockedIp(ip)).toBe(false),
  );
});

describe("safeFetch guard (no network)", () => {
  it.each([
    "http://localhost:3000/",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[::ffff:a9fe:a9fe]/latest/meta-data/",
    "http://10.0.0.5/admin",
    "http://foo.localhost/",
    "file:///etc/passwd",
    "ftp://example.com/",
    "https://user:pass@example.com/",
    "not a url",
  ])("rejects %s", async (url) => {
    await expect(safeFetch(url)).rejects.toBeInstanceOf(SafeFetchError);
  });
});
