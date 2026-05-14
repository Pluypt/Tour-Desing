"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LibraryActions({ planId }: { planId: string }) {
  const router = useRouter();

  const handleDuplicate = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะคัดลอกแพลนนี้?")) return;
    
    try {
      const res = await fetch(`/api/tour-plans/${planId}/duplicate`, { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        alert("คัดลอกแพลนเรียบร้อยแล้ว!");
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาดในการคัดลอกแพลน");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการคัดลอกแพลน");
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบแพลนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    
    try {
      const res = await fetch(`/api/tour-plans/${planId}`, { method: "DELETE" });
      
      if (res.ok) {
        alert("ลบแพลนเรียบร้อยแล้ว");
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาดในการลบแพลน");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการลบแพลน");
    }
  };

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
      <Link href={`/preview/${planId}`} style={{ color: "var(--pr-text-main)", fontSize: "0.9rem" }}>พรีวิว</Link>
      <Link href={`/builder/${planId}`} style={{ color: "var(--pr-red)", fontWeight: 500, fontSize: "0.9rem" }}>แก้ไข</Link>
      <button onClick={handleDuplicate} style={{ color: "var(--pr-text-muted)", fontSize: "0.9rem" }}>คัดลอก</button>
      <button onClick={handleDelete} style={{ color: "var(--pr-red)", fontSize: "0.9rem" }}>ลบ</button>
    </div>
  );
}
