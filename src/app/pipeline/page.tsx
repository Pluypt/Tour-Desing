import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PIPELINE_STAGES = [
  { status: "Draft", color: "#9e9e9e", label: "ฉบับร่าง" },
  { status: "Internal Review", color: "#1565c0", label: "รอตรวจสอบ" },
  { status: "Sent to Customer", color: "#0277bd", label: "ส่งลูกค้าแล้ว" },
  { status: "Customer Requested Revision", color: "#e65100", label: "รอแก้ไข" },
  { status: "Waiting for Deposit", color: "#f9a825", label: "รอมัดจำ" },
  { status: "Deposit Paid", color: "#2e7d32", label: "ชำระมัดจำแล้ว" },
  { status: "Confirmed", color: "#1b5e20", label: "ยืนยันแล้ว" },
  { status: "Completed", color: "#388e3c", label: "เสร็จสิ้น" },
  { status: "Cancelled", color: "#c62828", label: "ยกเลิก" },
];

export default async function PipelinePage() {
  const plans = await prisma.tourPlan.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      customer: { select: { name: true } },
    },
  });

  const grouped = PIPELINE_STAGES.map(stage => ({
    ...stage,
    plans: plans.filter(p => p.status === stage.status),
  }));

  const totalRevenue = plans
    .filter(p => ["Deposit Paid", "Confirmed", "Completed"].includes(p.status || ""))
    .reduce((sum, p) => sum + (p.total_selling_price || 0), 0);

  return (
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Sales Pipeline</h1>
        <div style={{ fontSize: "0.9rem", color: "var(--pr-text-muted)" }}>
          ยอดขายที่ยืนยันแล้ว: <strong style={{ color: "#2e7d32", fontSize: "1.1rem" }}>{totalRevenue.toLocaleString()} บาท</strong>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {PIPELINE_STAGES.map(stage => {
          const count = plans.filter(p => p.status === stage.status).length;
          return (
            <div key={stage.status} style={{ padding: "14px", backgroundColor: "white", borderRadius: "8px", borderLeft: `4px solid ${stage.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--pr-text-muted)", marginBottom: "4px" }}>{stage.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stage.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Kanban-style list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {grouped.filter(g => g.plans.length > 0).map(group => (
          <div key={group.status} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: group.color }} />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>{group.label}</h3>
              <span style={{ backgroundColor: group.color + "22", color: group.color, padding: "1px 8px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700 }}>
                {group.plans.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {group.plans.map(plan => (
                <Link key={plan.id} href={`/builder/${plan.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 14px", backgroundColor: "#fafafa", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--pr-red)", marginBottom: "4px" }}>
                      {plan.title || "Untitled"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", marginBottom: "6px" }}>
                      {plan.tour_code} • {plan.customer?.name || "-"}
                    </div>
                    <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem", color: "#555", flexWrap: "wrap" }}>
                      <span>🌏 {plan.country || "-"}</span>
                      <span>👥 {plan.traveler_count} ท่าน</span>
                      {plan.selling_price_per_person && (
                        <span>💰 {plan.selling_price_per_person.toLocaleString()}/ท่าน</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
