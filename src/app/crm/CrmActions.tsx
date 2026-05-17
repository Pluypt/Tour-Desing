"use client";
import Link from "next/link";

export default function CrmActions({ customerId }: { customerId: string }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <Link href={`/crm/${customerId}`} style={{ color: "var(--pr-red)", fontWeight: 500, fontSize: "0.85rem" }}>
        ดูรายละเอียด
      </Link>
    </div>
  );
}
