"use client";

export default function ExportButtons({ title }: { title: string }) {
  const handleExportPDF = async () => {
    // Dynamically import html2pdf so it only loads on the client side
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('proposal-document');
      if (!element) { alert("ไม่พบเอกสาร"); return; }
      
      const opt = {
        margin:       [15, 0] as [number, number], // เว้นขอบบน-ล่าง 15mm (ซ้าย-ขวา 0 เพราะตัวเอกสารมี padding ซ้ายขวาอยู่แล้ว)
        filename:     `${title || 'Tour_Proposal'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        html2canvas:  { 
          scale: 3, 
          useCORS: true,
          onclone: (clonedDoc: Document) => {
            const doc = clonedDoc.getElementById('proposal-document');
            if (doc) {
              doc.style.paddingTop = '0';
              doc.style.paddingBottom = '0';
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
