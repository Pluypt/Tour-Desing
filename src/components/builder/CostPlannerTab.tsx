"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/pricing";

type CostItem = {
  id: string;
  category: string;
  item_name: string;
  cost_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  note: string;
};

type PricingSummary = {
  totalFixedCost: number;
  totalVariableCost: number;
  totalCost: number;
  costPerPerson: number;
  sellingPricePerPerson: number;
  totalSellingPrice: number;
  profitAmount: number;
  profitPercent: number;
  depositAmount: number;
  remainingAmount: number;
};

const CATEGORIES = ["flight", "hotel", "transport", "guide", "meal", "ticket", "visa", "insurance", "operation", "other"];
const COST_TYPES = [
  { value: "fixed_group", label: "เหมากรุ๊ป" },
  { value: "per_person", label: "ต่อคน" },
  { value: "per_day", label: "ต่อวัน" },
  { value: "per_room", label: "ต่อห้อง" },
];

export default function CostPlannerTab({ planId, travelerCount, duration }: { planId: string; travelerCount: number; duration: number }) {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [pricingMethod, setPricingMethod] = useState("percent");
  const [targetProfitPercent, setTargetProfitPercent] = useState(20);
  const [targetProfitPerPerson, setTargetProfitPerPerson] = useState(0);
  const [manualPrice, setManualPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCosts = useCallback(async () => {
    const res = await fetch(`/api/tour-plans/${planId}/costs`);
    const data = await res.json();
    if (data.success) setCosts(data.costs);
  }, [planId]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  const addRow = () => {
    setCosts(prev => [...prev, {
      id: "new-" + Date.now(),
      category: "other",
      item_name: "",
      cost_type: "fixed_group",
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      note: "",
    }]);
  };

  const updateRow = (id: string, field: string, value: string | number) => {
    setCosts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      // Recalculate total_cost locally
      const qty = field === "quantity" ? Number(value) : updated.quantity;
      const unit = field === "unit_cost" ? Number(value) : updated.unit_cost;
      const type = field === "cost_type" ? String(value) : updated.cost_type;
      let total = qty * unit;
      if (type === "per_person") total = travelerCount * qty * unit;
      else if (type === "per_day") total = duration * qty * unit;
      updated.total_cost = Math.round(total * 100) / 100;
      return updated;
    }));
  };

  const saveRow = async (item: CostItem) => {
    setSaving(true);
    try {
      if (item.id.startsWith("new-")) {
        const res = await fetch(`/api/tour-plans/${planId}/costs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const data = await res.json();
        if (data.success) {
          setCosts(prev => prev.map(c => c.id === item.id ? data.cost : c));
        }
      } else {
        await fetch(`/api/tour-plans/${planId}/costs/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (item: CostItem) => {
    if (!item.id.startsWith("new-")) {
      await fetch(`/api/tour-plans/${planId}/costs/${item.id}`, { method: "DELETE" });
    }
    setCosts(prev => prev.filter(c => c.id !== item.id));
  };

  const calculatePricing = async () => {
    setLoading(true);
    try {
      // Save all unsaved rows first
      for (const item of costs) {
        if (item.id.startsWith("new-") || item.item_name) {
          await saveRow(item);
        }
      }
      const res = await fetch(`/api/tour-plans/${planId}/calculate-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingMethod,
          targetProfitPercent: pricingMethod === "percent" ? targetProfitPercent : null,
          targetProfitPerPerson: pricingMethod === "profit_per_person" ? targetProfitPerPerson : null,
          manualSellingPricePerPerson: pricingMethod === "manual" ? manualPrice : null,
        }),
      });
      const data = await res.json();
      if (data.success) setPricing(data.pricing);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", margin: 0 }}>ต้นทุนและราคา</h2>
        <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.9rem" }} onClick={addRow}>+ เพิ่มรายการต้นทุน</button>
      </div>

      {/* Cost Table */}
      <div style={{ overflowX: "auto", marginBottom: "30px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--pr-gray-100)", borderBottom: "2px solid var(--border-color)" }}>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>หมวดหมู่</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>รายการ</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>ประเภท</th>
              <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>จำนวน</th>
              <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>ราคาต่อหน่วย</th>
              <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>รวม</th>
              <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {costs.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--pr-text-muted)" }}>ยังไม่มีรายการต้นทุน คลิก "เพิ่มรายการต้นทุน" เพื่อเริ่มต้น</td></tr>
            )}
            {costs.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "8px" }}>
                  <select className="form-control" style={{ padding: "6px", fontSize: "0.85rem" }} value={item.category} onChange={e => updateRow(item.id, "category", e.target.value)} onBlur={() => saveRow(item)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td style={{ padding: "8px" }}>
                  <input type="text" className="form-control" style={{ padding: "6px", fontSize: "0.85rem" }} value={item.item_name} onChange={e => updateRow(item.id, "item_name", e.target.value)} onBlur={() => saveRow(item)} placeholder="ชื่อรายการ" />
                </td>
                <td style={{ padding: "8px" }}>
                  <select className="form-control" style={{ padding: "6px", fontSize: "0.85rem" }} value={item.cost_type} onChange={e => updateRow(item.id, "cost_type", e.target.value)} onBlur={() => saveRow(item)}>
                    {COST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: "8px" }}>
                  <input type="number" className="form-control" style={{ padding: "6px", fontSize: "0.85rem", textAlign: "right" }} value={item.quantity} onChange={e => updateRow(item.id, "quantity", e.target.value)} onBlur={() => saveRow(item)} min={1} />
                </td>
                <td style={{ padding: "8px" }}>
                  <input type="number" className="form-control" style={{ padding: "6px", fontSize: "0.85rem", textAlign: "right" }} value={item.unit_cost} onChange={e => updateRow(item.id, "unit_cost", e.target.value)} onBlur={() => saveRow(item)} min={0} />
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: 600, color: "var(--pr-red)" }}>
                  {item.total_cost.toLocaleString()}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <button onClick={() => deleteRow(item)} style={{ color: "var(--pr-red)", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer" }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
          {costs.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: "var(--pr-gray-100)", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "10px 8px", textAlign: "right" }}>ต้นทุนรวมทั้งหมด:</td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: "var(--pr-red)" }}>
                  {costs.reduce((s, c) => s + c.total_cost, 0).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pricing Method */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "15px" }}>วิธีคำนวณราคาขาย</h3>
        <div style={{ display: "flex", gap: "20px", marginBottom: "15px", flexWrap: "wrap" }}>
          {[
            { value: "percent", label: "กำไร %" },
            { value: "profit_per_person", label: "กำไรต่อคน" },
            { value: "manual", label: "กำหนดเอง" },
          ].map(m => (
            <label key={m.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input type="radio" name="pricingMethod" value={m.value} checked={pricingMethod === m.value} onChange={() => setPricingMethod(m.value)} />
              {m.label}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
          {pricingMethod === "percent" && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">กำไรที่ต้องการ (%)</label>
              <input type="number" className="form-control" style={{ width: "150px" }} value={targetProfitPercent} onChange={e => setTargetProfitPercent(Number(e.target.value))} min={0} />
            </div>
          )}
          {pricingMethod === "profit_per_person" && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">กำไรต่อคน (บาท)</label>
              <input type="number" className="form-control" style={{ width: "150px" }} value={targetProfitPerPerson} onChange={e => setTargetProfitPerPerson(Number(e.target.value))} min={0} />
            </div>
          )}
          {pricingMethod === "manual" && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">ราคาขายต่อคน (บาท)</label>
              <input type="number" className="form-control" style={{ width: "150px" }} value={manualPrice} onChange={e => setManualPrice(Number(e.target.value))} min={0} />
            </div>
          )}
          <button className="btn-primary" onClick={calculatePricing} disabled={loading} style={{ marginBottom: "0" }}>
            {loading ? "กำลังคำนวณ..." : "คำนวณราคา"}
          </button>
        </div>
      </div>

      {/* Pricing Summary */}
      {pricing && (
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "15px" }}>สรุปราคา (ภายใน — ไม่แสดงลูกค้า)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            <SummaryCard label="ต้นทุนรวม" value={formatCurrency(pricing.totalCost)} color="#757575" />
            <SummaryCard label="ต้นทุนต่อคน" value={formatCurrency(pricing.costPerPerson)} color="#757575" />
            <SummaryCard label="ราคาขายต่อคน" value={formatCurrency(pricing.sellingPricePerPerson)} color="#1976D2" />
            <SummaryCard label="ยอดขายรวม" value={formatCurrency(pricing.totalSellingPrice)} color="#1976D2" />
            <SummaryCard label="กำไรรวม" value={formatCurrency(pricing.profitAmount)} color="#388E3C" />
            <SummaryCard label={`กำไร (${pricing.profitPercent.toFixed(1)}%)`} value={`${pricing.profitPercent.toFixed(2)}%`} color="#388E3C" />
          </div>
          <div style={{ padding: "15px", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px solid #ffebeb", fontSize: "0.9rem" }}>
            <strong>มัดจำ 30%:</strong> {formatCurrency(pricing.depositAmount)} &nbsp;|&nbsp;
            <strong>ยอดคงเหลือ:</strong> {formatCurrency(pricing.remainingAmount)}
          </div>
          {saving && <p style={{ color: "var(--pr-text-muted)", fontSize: "0.85rem", marginTop: "10px" }}>กำลังบันทึก...</p>}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "15px", backgroundColor: "var(--pr-gray-100)", borderRadius: "8px", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "0.8rem", color: "var(--pr-text-muted)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
