import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aibot-sonurust — Intelligent AI Issue Assistant for GitHub",
  description:
    "Automate issue triage, code explanations, and debugging on GitHub using Google Gemini 3.5 Flash and Cloudflare Workers.",
  keywords: [
    "GitHub App",
    "GitHub Action",
    "Gemini 3.5 Flash",
    "AI Code Assistant",
    "Issue Triage",
    "Cloudflare Workers",
  ],
  authors: [{ name: "sonurust", url: "https://github.com/sonurust" }],
  openGraph: {
    title: "aibot-sonurust — Intelligent AI Issue Assistant for GitHub",
    description:
      "Automated issue triage, code explanations, and debugging on GitHub using Google Gemini 3.5 Flash.",
    url: "https://aibot-github-app.skbhati199.workers.dev",
    siteName: "aibot-sonurust",
    images: [
      {
        url: "/banner.png",
        width: 965,
        height: 482,
        alt: "aibot-sonurust GitHub Marketplace Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
