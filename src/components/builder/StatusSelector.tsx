"use client";

import { useState } from "react";

const STATUSES = [
  { value: "Draft", color: "#9e9e9e" },
  { value: "AI Generated", color: "#7b1fa2" },
  { value: "Internal Review", color: "#1565c0" },
  { value: "Sent to Customer", color: "#0277bd" },
  { value: "Customer Requested Revision", color: "#e65100" },
  { value: "Revised", color: "#f57c00" },
  { value: "Waiting for Deposit", color: "#f9a825" },
  { value: "Deposit Paid", color: "#2e7d32" },
  { value: "Confirmed", color: "#1b5e20" },
  { value: "Completed", color: "#388e3c" },
  { value: "Cancelled", color: "#c62828" },
];

export default function StatusSelector({ planId, currentStatus }: { planId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus || "Draft");
  const [saving, setSaving] = useState(false);

  const current = STATUSES.find(s => s.value === status) || STATUSES[0];

  const handleChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tour-plans/${planId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setStatus(newStatus);
      else alert("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "0.8rem", color: "var(--pr-text-muted)" }}>สถานะ:</span>
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        style={{
          padding: "4px 10px",
          borderRadius: "12px",
          border: `2px solid ${current.color}`,
          backgroundColor: current.color + "18",
          color: current.color,
          fontWeight: 700,
          fontSize: "0.8rem",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.value}</option>
        ))}
      </select>
      {saving && <span style={{ fontSize: "0.75rem", color: "var(--pr-text-muted)" }}>กำลังบันทึก...</span>}
    </div>
  );
}
