import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LibraryActions from "./LibraryActions";

export const dynamic = "force-dynamic";

export default async function TourLibraryPage() {
  const plans = await prisma.tourPlan.findMany({
    orderBy: { updated_at: "desc" },
    include: { customer: true }
  });

  return (
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>คลังแพลนทัวร์ (Tour Library)</h1>
        <Link href="/request-form" className="btn-primary">
          + สร้างแพลนทัวร์ใหม่
        </Link>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
          <input type="text" className="form-control" placeholder="ค้นหาชื่อลูกค้า..." style={{ width: "250px" }} />
          <input type="text" className="form-control" placeholder="ค้นหาประเทศ/เมือง..." style={{ width: "250px" }} />
          <select className="form-control" style={{ width: "200px" }}>
            <option value="">ทุกสถานะ</option>
            <option value="Draft">ฉบับร่าง (Draft)</option>
            <option value="Sent">ส่งลูกค้าแล้ว</option>
            <option value="Confirmed">ยืนยันแล้ว</option>
          </select>
        </div>

        {plans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--pr-text-muted)" }}>
            ยังไม่มีข้อมูลแพลนทัวร์ในระบบ
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>รหัสทัวร์</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>ชื่อลูกค้า</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>ประเทศ / เมือง</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>วันเดินทาง</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>จำนวนคน</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>สถานะ</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500, textAlign: "right" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px" }}>{plan.tour_code || "-"}</td>
                  <td style={{ padding: "12px" }}>{plan.customer?.name || "Unknown"}</td>
                  <td style={{ padding: "12px" }}>{plan.country} / {plan.main_city}</td>
                  <td style={{ padding: "12px" }}>
                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : "-"} - {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>{plan.traveler_count}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "0.85rem",
                      backgroundColor: plan.status === 'Draft' ? 'var(--pr-gray-200)' : 'rgba(211, 47, 47, 0.1)',
                      color: plan.status === 'Draft' ? 'var(--pr-text-main)' : 'var(--pr-red)'
                    }}>
                      {plan.status === 'Draft' ? 'ฉบับร่าง' : plan.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <LibraryActions planId={plan.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
