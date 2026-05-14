import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Dashboard() {
  // Fetch stats from DB
  const totalPlans = await prisma.tourPlan.count();
  const draftPlans = await prisma.tourPlan.count({ where: { status: "Draft" } });
  const sentPlans = await prisma.tourPlan.count({ where: { status: "Sent to Customer" } });
  const revisedPlans = await prisma.tourPlan.count({ where: { status: "Revised" } });
  const confirmedPlans = await prisma.tourPlan.count({ where: { status: "Confirmed" } });
  const depositPaid = await prisma.tourPlan.count({ where: { status: "Deposit Paid" } });

  const recentPlans = await prisma.tourPlan.findMany({
    take: 5,
    orderBy: { updated_at: "desc" },
    include: { customer: true }
  });

  return (
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>ภาพรวมระบบ (Dashboard)</h1>
        <Link href="/request-form" className="btn-primary">
          + สร้างแพลนทัวร์ใหม่
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <StatCard title="แพลนทั้งหมด" value={totalPlans} color="var(--pr-text-main)" />
        <StatCard title="ฉบับร่าง (Draft)" value={draftPlans} color="#757575" />
        <StatCard title="ส่งลูกค้าแล้ว" value={sentPlans} color="#1976D2" />
        <StatCard title="รอแก้ไข" value={revisedPlans} color="#F57C00" />
        <StatCard title="ยืนยันแล้ว" value={confirmedPlans} color="#388E3C" />
        <StatCard title="ชำระมัดจำแล้ว" value={depositPaid} color="var(--pr-red)" />
      </div>

      {/* Recent Plans Table */}
      <div className="card">
        <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>แพลนทัวร์ล่าสุด</h2>
        
        {recentPlans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--pr-text-muted)" }}>
            ยังไม่มีแพลนทัวร์ คลิก "สร้างแพลนทัวร์ใหม่" เพื่อเริ่มต้น
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>รหัสทัวร์</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>ชื่อโปรแกรม</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>ชื่อลูกค้า</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>สถานะ</th>
                <th style={{ padding: "12px", color: "var(--pr-text-muted)", fontWeight: 500 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {recentPlans.map(plan => (
                <tr key={plan.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px" }}>{plan.tour_code || "-"}</td>
                  <td style={{ padding: "12px" }}>{plan.title || "Untitled"}</td>
                  <td style={{ padding: "12px" }}>{plan.customer?.name || "Unknown"}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "0.85rem",
                      backgroundColor: plan.status === 'Draft' ? 'var(--pr-gray-200)' : 'rgba(211, 47, 47, 0.1)',
                      color: plan.status === 'Draft' ? 'var(--pr-text-main)' : 'var(--pr-red)'
                    }}>
                      {plan.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Link href={`/builder/${plan.id}`} style={{ color: "var(--pr-red)", fontWeight: 500, marginRight: "10px" }}>แก้ไข</Link>
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

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}`, padding: "20px" }}>
      <div style={{ fontSize: "0.9rem", color: "var(--pr-text-muted)", marginBottom: "10px" }}>{title}</div>
      <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}
