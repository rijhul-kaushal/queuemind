import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueueMind — Intelligent Job Queue & Workload Scheduling Platform",
  description: "Developer-focused background job orchestration, multi-worker scheduling simulation, and workload performance intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#080c14] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
