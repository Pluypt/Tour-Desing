import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
import CrmActions from "./CrmActions";

const STATUS_COLORS: Record<string, string> = {
  "Draft": "#9e9e9e",
  "AI Generated": "#7b1fa2",
  "Internal Review": "#1565c0",
  "Sent to Customer": "#0277bd",
  "Customer Requested Revision": "#e65100",
  "Revised": "#f57c00",
  "Waiting for Deposit": "#f9a825",
  "Deposit Paid": "#2e7d32",
  "Confirmed": "#1b5e20",
  "Completed": "#388e3c",
  "Cancelled": "#c62828",
};

export default async function CrmPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      TourPlans: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: { id: true, status: true, title: true, country: true, created_at: true },
      },
      _count: { select: { TourPlans: true } },
    },
  });

  return (
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>ข้อมูลลูกค้า (CRM)</h1>
        <Link href="/request-form" className="btn-primary">+ สร้างแพลนทัวร์ใหม่</Link>
      </div>

      <div className="card">
        {customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--pr-text-muted)" }}>
            ยังไม่มีข้อมูลลูกค้า
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                {["ชื่อลูกค้า", "เบอร์โทร / LINE", "ประเภท", "แพลนล่าสุด", "สถานะ", "จำนวนแพลน", "จัดการ"].map(h => (
                  <th key={h} style={{ padding: "12px 10px", color: "var(--pr-text-muted)", fontWeight: 500, fontSize: "0.9rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => {
                const latest = customer.TourPlans[0];
                const statusColor = STATUS_COLORS[latest?.status || ""] || "#9e9e9e";
                return (
                  <tr key={customer.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <Link href={`/crm/${customer.id}`} style={{ fontWeight: 600, color: "var(--pr-red)" }}>
                        {customer.name}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "var(--pr-text-muted)" }}>
                      <div>{customer.phone || "-"}</div>
                      {customer.line_id && <div style={{ color: "#00b900" }}>LINE: {customer.line_id}</div>}
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: "0.85rem" }}>{customer.customer_type || "-"}</td>
                    <td style={{ padding: "12px 10px", fontSize: "0.85rem" }}>
                      {latest ? (
                        <Link href={`/builder/${latest.id}`} style={{ color: "var(--pr-text-main)" }}>
                          {latest.title || latest.country || "Untitled"}
                        </Link>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      {latest?.status ? (
                        <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600, backgroundColor: statusColor + "22", color: statusColor }}>
                          {latest.status}
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontSize: "0.9rem", fontWeight: 600 }}>
                      {customer._count.TourPlans}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <CrmActions customerId={customer.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
