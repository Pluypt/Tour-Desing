"use client";

export default function ExportButtons({ title }: { title: string }) {
  const handleExportPDF = async () => {
    // Dynamically import html2pdf so it only loads on the client side
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('proposal-document');
      
      const opt = {
        margin:       0,
        filename:     `${title || 'Tour_Proposal'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
