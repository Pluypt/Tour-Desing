import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CustomerEditForm from "./CustomerEditForm";

const STATUS_COLORS: Record<string, string> = {
  "Draft": "#9e9e9e", "AI Generated": "#7b1fa2", "Internal Review": "#1565c0",
  "Sent to Customer": "#0277bd", "Customer Requested Revision": "#e65100",
  "Revised": "#f57c00", "Waiting for Deposit": "#f9a825",
  "Deposit Paid": "#2e7d32", "Confirmed": "#1b5e20",
  "Completed": "#388e3c", "Cancelled": "#c62828",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      TourPlans: {
        orderBy: { created_at: "desc" },
        select: {
          id: true, tour_code: true, title: true, country: true, main_city: true,
          start_date: true, end_date: true, duration: true, traveler_count: true,
          status: true, selling_price_per_person: true, total_selling_price: true,
          created_at: true,
        },
      },
    },
  });

  if (!customer) return notFound();

  return (
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Link href="/crm" style={{ color: "var(--pr-text-muted)", fontSize: "0.85rem" }}>← กลับ CRM</Link>
          <h1 className="page-title" style={{ margin: "6px 0 0" }}>{customer.name}</h1>
        </div>
        <Link href="/request-form" className="btn-primary">+ สร้างแพลนใหม่ให้ลูกค้านี้</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", alignItems: "start" }}>
        {/* Customer Info */}
        <CustomerEditForm customer={customer} />

        {/* Tour Plans */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>ประวัติแพลนทัวร์ ({customer.TourPlans.length})</h2>
            {customer.TourPlans.length === 0 ? (
              <div style={{ color: "var(--pr-text-muted)", padding: "20px 0", textAlign: "center" }}>ยังไม่มีแพลนทัวร์</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {customer.TourPlans.map(plan => {
                  const statusColor = STATUS_COLORS[plan.status || ""] || "#9e9e9e";
                  return (
                    <div key={plan.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <Link href={`/builder/${plan.id}`} style={{ fontWeight: 600, color: "var(--pr-red)", fontSize: "0.95rem" }}>
                            {plan.title || "Untitled"}
                          </Link>
                          <div style={{ fontSize: "0.8rem", color: "var(--pr-text-muted)", marginTop: "2px" }}>
                            {plan.tour_code} • {plan.country} {plan.main_city ? `/ ${plan.main_city}` : ""}
                          </div>
                        </div>
                        <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: statusColor + "22", color: statusColor, whiteSpace: "nowrap" }}>
                          {plan.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "0.82rem", color: "var(--pr-text-muted)", flexWrap: "wrap" }}>
                        <span>📅 {plan.start_date ? new Date(plan.start_date).toLocaleDateString("th-TH") : "-"} – {plan.end_date ? new Date(plan.end_date).toLocaleDateString("th-TH") : "-"}</span>
                        <span>👥 {plan.traveler_count} ท่าน</span>
                        {plan.selling_price_per_person && (
                          <span>💰 {plan.selling_price_per_person.toLocaleString()} บาท/ท่าน</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
