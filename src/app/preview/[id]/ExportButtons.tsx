"use client";

import { useState, useEffect } from "react";

export default function ExportButtons({ title }: { title: string }) {
  const [hideDates, setHideDates] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const doc = document.getElementById('proposal-document');
    if (doc) {
      if (hideDates) doc.classList.add('hide-dates');
      else doc.classList.remove('hide-dates');
    }
  }, [hideDates]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('proposal-document');
      if (!element) { alert("ไม่พบเอกสาร"); return; }
      
      const opt = {
        margin:       [10, 0, 12, 0] as [number, number, number, number],
        filename:     `${title || 'Tour_Proposal'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        pagebreak:    { 
          mode: ['css', 'legacy'],
          avoid: ['.page-break-avoid', '.timeline-item', '.meals-hotel-box', '.day-header-group', 'tr', '.cover-page', '.summary-block']
        },
        html2canvas:  { 
          scale: 2.5, 
          useCORS: true,
          logging: false,
          onclone: (clonedDoc: Document) => {
            const doc = clonedDoc.getElementById('proposal-document');
            if (doc) {
              doc.style.boxShadow = 'none';
              doc.style.margin = '0 auto';
            }
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDOCX = () => {
    alert("ฟีเจอร์การดาวน์โหลด DOCX จะถูกเพิ่มในอนาคตครับ");
  };

  const handleCopyCustomerLink = () => {
    const url = `${window.location.origin}/tour/${window.location.pathname.split('/').pop()}`;
    navigator.clipboard.writeText(url);
    alert(`คัดลอกลิงก์หน้าเว็บสำหรับลูกค้าเรียบร้อยแล้ว!\n\nURL: ${url}`);
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer", marginRight: "10px", color: "#555" }}>
        <input type="checkbox" checked={hideDates} onChange={(e) => setHideDates(e.target.checked)} />
        ซ่อนวันที่ในเอกสาร
      </label>
      <button className="btn-secondary" onClick={handleCopyCustomerLink} style={{ backgroundColor: "#E3F2FD", color: "#1976D2", borderColor: "#90CAF9" }}>
        🔗 ลิงก์เว็บส่งลูกค้า
      </button>
      <button className="btn-secondary" onClick={handlePrint} title="สั่งพิมพ์เอกสาร หรือ Save as PDF ผ่านเบราว์เซอร์">
        🖨️ พิมพ์ / บันทึก PDF (Browser)
      </button>
      <button className="btn-primary" onClick={handleExportPDF} disabled={isExporting}>
        {isExporting ? "กำลังประมวลผล PDF..." : "📥 ดาวน์โหลด PDF"}
      </button>
    </div>
  );
}
