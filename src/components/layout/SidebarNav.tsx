"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "หน้าหลัก", icon: "🏠" },
  { href: "/request-form", label: "สร้างแพลนใหม่", icon: "✨" },
  { href: "/library", label: "คลังแพลนทัวร์", icon: "📁" },
  { href: "/pipeline", label: "Sales Pipeline", icon: "📊" },
  { href: "/crm", label: "ข้อมูลลูกค้า (CRM)", icon: "👥" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: "16px 0" }}>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} style={{ marginBottom: "4px" }}>
              <Link
                href={item.href}
                className="sidebar-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  color: isActive ? "var(--pr-red)" : "var(--pr-text-main)",
                  backgroundColor: isActive ? "rgba(211, 47, 47, 0.08)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  borderLeft: isActive ? "4px solid var(--pr-red)" : "4px solid transparent",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
