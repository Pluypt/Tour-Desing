"use client";

export default function ExportButtons({ title }: { title: string }) {
  const handleExportPDF = async () => {
    // Dynamically import html2pdf so it only loads on the client side
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('proposal-document');
      if (!element) { alert("ไม่พบเอกสาร"); return; }
      
      const opt = {
        margin:       [15, 18, 15, 18] as [number, number, number, number], // เว้นขอบ บน ขวา ล่าง ซ้าย
        filename:     `${title || 'Tour_Proposal'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        pagebreak:    { mode: ['css', 'legacy'] }, // ให้เคารพคำสั่ง page-break-inside: avoid จะได้ไม่ตัดตัวอักษรหรือจุดขาดครึ่ง
        html2canvas:  { 
          scale: 3, 
          useCORS: true,
          onclone: (clonedDoc: Document) => {
            const doc = clonedDoc.getElementById('proposal-document');
            if (doc) {
              doc.style.padding = '0'; // ลบ padding เดิมออก
              doc.style.width = '174mm'; // กำหนดความกว้างเนื้อหาให้พอดีกับหน้า A4 (210) ลบขอบซ้ายขวา (18+18)
              doc.style.boxShadow = 'none'; // ลบเงาออกตอนแปลงเป็น PDF
            }
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleExportDOCX = () => {
    alert("ฟีเจอร์การดาวน์โหลด DOCX จะถูกเพิ่มในอนาคตครับ");
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <button className="btn-secondary" onClick={handleExportDOCX}>ดาวน์โหลด DOCX</button>
      <button className="btn-primary" onClick={handleExportPDF}>ดาวน์โหลด PDF</button>
    </div>
  );
}
