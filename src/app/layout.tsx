import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

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
        <div style={{ display: "flex", height: "100vh" }}>
          {/* Sidebar */}
          <aside style={{
            width: "250px",
            background: "var(--pr-white)",
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "var(--shadow-sm)",
            zIndex: 10,
          }}>
            <div style={{
              padding: "20px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <h1 style={{ color: "var(--pr-red)", fontSize: "1.2rem", fontWeight: "bold" }}>
                PR Travel
              </h1>
            </div>
            <nav style={{ flex: 1, padding: "20px 0" }}>
              <ul style={{ listStyle: "none" }}>
                <li>
                  <Link href="/" className="sidebar-link">
                    หน้าหลัก
                  </Link>
                </li>
                <li>
                  <Link href="/request-form" className="sidebar-link">
                    สร้างแพลนใหม่
                  </Link>
                </li>
                <li>
                  <Link href="/library" className="sidebar-link">
                    คลังแพลนทัวร์
                  </Link>
                </li>
                <li>
                  <Link href="/crm" className="sidebar-link">
                    ข้อมูลลูกค้า (CRM)
                  </Link>
                </li>
              </ul>
            </nav>
            <div style={{ padding: "20px", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--pr-text-muted)", textAlign: "center" }}>
              v1.0.0
            </div>
          </aside>

          {/* Main Content Area */}
          <main style={{ flex: 1, overflowY: "auto", padding: "30px" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
