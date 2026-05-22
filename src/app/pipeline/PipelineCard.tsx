"use client";

import Link from "next/link";

interface PipelineCardProps {
  id: string;
  title: string | null;
  tour_code: string | null;
  customerName: string | null;
  country: string | null;
  traveler_count: number | null;
  selling_price_per_person: number | null;
}

export default function PipelineCard({
  id,
  title,
  tour_code,
  customerName,
  country,
  traveler_count,
  selling_price_per_person,
}: PipelineCardProps) {
  return (
    <Link href={`/builder/${id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "12px 14px",
          backgroundColor: "#fafafa",
          transition: "box-shadow 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--pr-red)", marginBottom: "4px" }}>
          {title || "Untitled"}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", marginBottom: "6px" }}>
          {tour_code} • {customerName || "-"}
        </div>
        <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem", color: "#555", flexWrap: "wrap" }}>
          <span>🌏 {country || "-"}</span>
          <span>👥 {traveler_count} ท่าน</span>
          {selling_price_per_person && (
            <span>💰 {selling_price_per_person.toLocaleString()}/ท่าน</span>
          )}
        </div>
      </div>
    </Link>
  );
}
