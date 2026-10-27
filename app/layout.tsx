import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "OAuth Readiness",
  description: "Guides for creating and getting approval for an OAuth app: effort, wait time, review, and blockers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" className={`${GeistSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="no-print border-b border-border">
          <nav className="mx-auto flex max-w-[1240px] items-center gap-6 px-4 py-3 text-sm">
            <Link href="/" className="text-base text-foreground no-underline">
              OAuth Readiness
            </Link>
            <Link href="/#library" className="text-muted no-underline hover:text-foreground">
              Library
            </Link>
            <Link href="/about" className="text-muted no-underline hover:text-foreground">
              About
            </Link>
            <Link
              href="/#generate"
              className="ml-auto rounded-md bg-foreground px-3 py-1.5 text-background no-underline hover:opacity-90"
            >
              Generate guide
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-[1240px] px-4 py-8">{children}</main>
        <footer className="no-print mx-auto max-w-[1240px] border-t border-border px-4 py-6 text-xs text-muted">
          A take-home for Composio&apos;s APM Integrations role. Not an official Composio product.
        </footer>
      </body>
    </html>
  );
}
