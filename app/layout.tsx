import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
export const metadata: Metadata = {
  title: { default: "ScaleSight - Beverage Planning Workspace", template: "%s | ScaleSight" },
  description: "Managed beverage planning workspace for RTD brands. Demo with synthetic data.",
  robots: { index: false, follow: false },
  authors: [{ name: "ScaleSight planning team" }],
  openGraph: { title: "ScaleSight - Beverage Planning Workspace", description: "Managed beverage planning workspace for RTD brands. DEMO DATA - Synthetic Example." },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
