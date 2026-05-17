"use client";

import { useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  email?: string | null;
  customer_type: string | null;
  traveler_count: number | null;
  age_range: string | null;
  note: string | null;
  average_budget?: number | null;
  interested_countries?: string | null;
  internal_note?: string | null;
};

export default function CustomerEditForm({ customer }: { customer: Customer }) {
  const [form, setForm] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    line_id: customer.line_id || "",
    email: customer.email || "",
    customer_type: customer.customer_type || "",
    traveler_count: customer.traveler_count?.toString() || "",
    age_range: customer.age_range || "",
    note: customer.note || "",
    average_budget: customer.average_budget?.toString() || "",
    interested_countries: customer.interested_countries || "",
    internal_note: customer.internal_note || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
      else alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>ข้อมูลลูกค้า</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "6px 16px", fontSize: "0.85rem" }}>
          {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[
          ["name", "ชื่อลูกค้า *", "text"],
          ["phone", "เบอร์โทร", "text"],
          ["line_id", "LINE ID", "text"],
          ["email", "อีเมล", "email"],
        ].map(([field, label, type]) => (
          <div key={field} className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>{label}</label>
            <input
              type={type}
              className="form-control"
              value={form[field as keyof typeof form]}
              onChange={e => handleChange(field, e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
          </div>
        ))}

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.85rem" }}>ประเภทลูกค้า</label>
          <select className="form-control" value={form.customer_type} onChange={e => handleChange("customer_type", e.target.value)} style={{ fontSize: "0.9rem" }}>
            {["Family", "Senior", "Working", "Friends", "Corporate", "Group", "Business"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>จำนวนผู้เดินทางปกติ</label>
            <input type="number" className="form-control" value={form.traveler_count} onChange={e => handleChange("traveler_count", e.target.value)} style={{ fontSize: "0.9rem" }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>งบประมาณเฉลี่ย (บาท/คน)</label>
            <input type="number" className="form-control" value={form.average_budget} onChange={e => handleChange("average_budget", e.target.value)} style={{ fontSize: "0.9rem" }} />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.85rem" }}>ประเทศที่สนใจ</label>
          <input type="text" className="form-control" value={form.interested_countries} onChange={e => handleChange("interested_countries", e.target.value)} placeholder="เช่น ญี่ปุ่น, เกาหลี, ยุโรป" style={{ fontSize: "0.9rem" }} />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.85rem" }}>หมายเหตุลูกค้า</label>
          <textarea className="form-control" value={form.note} onChange={e => handleChange("note", e.target.value)} rows={2} style={{ fontSize: "0.9rem" }} />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-red)" }}>หมายเหตุภายใน (ไม่แสดงลูกค้า)</label>
          <textarea className="form-control" value={form.internal_note} onChange={e => handleChange("internal_note", e.target.value)} rows={2} style={{ fontSize: "0.9rem", borderColor: "#ffcdd2" }} />
        </div>
      </div>
    </div>
  );
}
