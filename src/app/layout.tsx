import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

import SidebarNav from "@/components/layout/SidebarNav";

export const metadata: Metadata = {
  title: "PR Travel Tour Builder",
  description: "Internal system for PR Travel Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-root-layout">
          {/* Sidebar */}
          <aside className="app-sidebar no-print">
            <div style={{
              padding: "20px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <h1 style={{ color: "var(--pr-red)", fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
                  PR Travel
                </h1>
              </Link>
            </div>
            
            <SidebarNav />

            <div style={{ padding: "20px", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--pr-text-muted)", textAlign: "center" }}>
              v1.0.0
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="app-main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
