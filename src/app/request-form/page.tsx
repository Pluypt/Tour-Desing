"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const initialFormData = {
  customerName: "",
  phone: "",
  lineId: "",
  customerType: "Family",
  travelerCount: "2",
  ageRange: "",
  customerNote: "",
  country: "",
  mainCity: "",
  secondaryCity: "",
  startDate: "",
  endDate: "",
  duration: "3",
  tripType: "Private Tour",
  tourCode: "",
  title: "",
  theme: "Nature",
  hotelLevel: "3 ดาว",
  budgetPerPerson: "",
};

export default function TourRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [originalPlanFile, setOriginalPlanFile] = useState<{mimeType: string, data: string} | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const calculateDurationFromDates = (startStr: string, endStr: string) => {
    if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays.toString();
      }
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "startDate" || name === "endDate") {
        const dur = calculateDurationFromDates(
          name === "startDate" ? value : prev.startDate,
          name === "endDate" ? value : prev.endDate
        );
        if (dur) next.duration = dur;
      }
      return next;
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Auto calculate duration or fallback to 3 days
    let currentDuration = formData.duration;
    if (!currentDuration && formData.startDate && formData.endDate) {
      currentDuration = calculateDurationFromDates(formData.startDate, formData.endDate);
    }
    if (!currentDuration || parseInt(currentDuration) <= 0) {
      currentDuration = "3";
    }

    // Check required fields with specific error messaging
    const missingFields: string[] = [];
    if (!formData.customerName?.trim()) missingFields.push("ชื่อลูกค้า");
    if (!formData.country?.trim()) missingFields.push("ประเทศปลายทาง");
    if (!formData.mainCity?.trim()) missingFields.push("เมืองหลัก");
    if (!formData.travelerCount || parseInt(formData.travelerCount) <= 0) missingFields.push("จำนวนผู้เดินทาง");

    if (missingFields.length > 0) {
      alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ${missingFields.join(", ")}`);
      return;
    }

    const payload = {
      ...formData,
      customerName: formData.customerName.trim(),
      country: formData.country.trim(),
      mainCity: formData.mainCity.trim(),
      travelerCount: formData.travelerCount || "2",
      duration: currentDuration,
      startDate: formData.startDate || new Date().toISOString().split("T")[0],
      originalPlanFile,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Response Error:", res.status, text);
        let msg = `เกิดข้อผิดพลาดในการสร้างแผนทัวร์ (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) msg = parsed.error;
          else if (parsed.message) msg = parsed.message;
        } catch (_) {
          if (text) msg += `: ${text.slice(0, 100)}`;
        }
        alert(msg);
        return;
      }
      
      const data = await res.json();
      if (data.success && data.planId) {
        router.push(`/builder/${data.planId}`);
      } else {
        alert(data.error || "ไม่สามารถสร้างแผนทัวร์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Generate plan exception:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตและลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFormData(initialFormData);
    setOriginalPlanFile(null);
  };

  return (
    <form onSubmit={handleGenerate} className="container" style={{ padding: 0 }}>
      <h1 className="page-title">Tour Request Form</h1>
      
      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Section A: ข้อมูลลูกค้า</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">ชื่อลูกค้า *</label>
            <input type="text" className="form-control" name="customerName" placeholder="เช่น คุณสมชาย" value={formData.customerName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">เบอร์โทร</label>
            <input type="text" className="form-control" name="phone" placeholder="เช่น 0812345678" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">ประเภทลูกค้า</label>
            <select className="form-control" name="customerType" value={formData.customerType} onChange={handleChange}>
              <option value="Family">ครอบครัว</option>
              <option value="Senior">ผู้สูงอายุ</option>
              <option value="Working">วัยทำงาน</option>
              <option value="Friends">กลุ่มเพื่อน</option>
              <option value="Corporate">บริษัท</option>
              <option value="Group">กรุ๊ปเหมา</option>
              <option value="Business">Business Trip</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">จำนวนผู้เดินทาง *</label>
            <input type="number" className="form-control" name="travelerCount" min="1" placeholder="เช่น 2" value={formData.travelerCount} onChange={handleChange} required />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Section B: ข้อมูลทริปหลัก</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">ประเทศปลายทาง *</label>
            <input type="text" className="form-control" name="country" placeholder="เช่น จีน, ญี่ปุ่น, ฮ่องกง" value={formData.country} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">เมืองหลัก *</label>
            <input type="text" className="form-control" name="mainCity" placeholder="เช่น คุนหมิง, โตเกียว, มาเก๊า" value={formData.mainCity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">วันที่เดินทาง เริ่มต้น</label>
            <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">วันที่เดินทาง สิ้นสุด</label>
            <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">จำนวนวัน (Auto Calculate)</label>
            <input type="text" className="form-control" name="duration" value={formData.duration} onChange={handleChange} placeholder="3" />
          </div>
          <div className="form-group">
            <label className="form-label">ประเภททริป</label>
            <select className="form-control" name="tripType" value={formData.tripType} onChange={handleChange}>
              <option value="Private Tour">Private Tour</option>
              <option value="Join Tour">Join Tour</option>
              <option value="Business Trip">Business Trip</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">แนบไฟล์แพลนต้นแบบ (PDF หรือรูปภาพ เพื่อให้ AI ดึงสถานที่จากแพลนนี้)</label>
            <input 
              type="file" 
              className="form-control" 
              accept=".pdf,image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setOriginalPlanFile(null);
                  return;
                }
                
                if (file.type === "application/pdf") {
                  try {
                    const pdfjsLib = await import('pdfjs-dist');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
                    
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const textContent = await page.getTextContent();
                      const pageText = textContent.items.map((item: any) => item.str).join(" ");
                      fullText += `--- Page ${i} ---\n${pageText}\n`;
                    }
                    
                    const base64 = btoa(unescape(encodeURIComponent(fullText)));
                    setOriginalPlanFile({ mimeType: "text/plain", data: base64 });
                    alert(`✅ สกัดข้อความจาก PDF สำเร็จ!`);
                  } catch (err) {
                    console.error("PDF Parsing error:", err);
                    alert("เกิดข้อผิดพลาดในการอ่านไฟล์ PDF โปรดลองไฟล์อื่น");
                    e.target.value = "";
                    setOriginalPlanFile(null);
                  }
                } else {
                  if (file.size > 3 * 1024 * 1024) {
                    alert("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 3MB)");
                    e.target.value = "";
                    setOriginalPlanFile(null);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    setOriginalPlanFile({ mimeType: file.type, data: base64 });
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>ความต้องการเฉพาะ / โรงแรม / อาหาร</h2>
        <div className="form-group">
          <label className="form-label">ระดับโรงแรม</label>
          <select className="form-control" name="hotelLevel" value={formData.hotelLevel} onChange={handleChange}>
            <option value="3 ดาว">3 ดาว หรือเทียบเท่า</option>
            <option value="4 ดาว">4 ดาว หรือเทียบเท่า</option>
            <option value="5 ดาว">5 ดาว หรือเทียบเท่า</option>
            <option value="5 ดาว (Luxury)">Luxury (5 ดาว)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🎯 หมายเหตุ & Master Prompt (ใส่แผนรายวัน, สถานที่เฉพาะ, กิจกรรม เพื่อให้ AI สกัดข้อมูลและประมวลผลเป็นแผนทัวร์จริง 100%)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-color, #2563eb)", fontWeight: 500 }}>✨ AI Prompt Directive</span>
          </label>
          <textarea 
            className="form-control" 
            name="customerNote" 
            value={formData.customerNote} 
            onChange={handleChange} 
            rows={8}
            placeholder={`สามารถพิมพ์หรือวาง Prompt รายละเอียดแผนทัวร์ได้ที่นี่ เช่น:\nDAY 1 — 1 พ.ย. | กรุงเทพฯ → คุนหมิง\n* เดินทางจากกรุงเทพฯ → คุนหมิง รับกรุ๊ปที่สนามบิน เข้าโรงแรม 3-4 ดาว\n* เย็นเที่ยวถนนคนเดินหนานผิงเจีย & ซุ้มประตูม้าทองไก่หยก\n\nDAY 2 — 2 พ.ย. | Stone Forest UNESCO ⭐\n* 07.30 น. เดินทางไปอุทยานป่าหิน Stone Forest เต็มวัน (ค่าบัตร 130 หยวน)...`}
          ></textarea>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>ราคาและงบประมาณ</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">งบประมาณต่อคน (บาท)</label>
            <input
              type="number"
              className="form-control"
              name="budgetPerPerson"
              placeholder="เว้นว่างเพื่อให้ระบบประเมินราคาตลาดจริงให้อัตโนมัติ"
              value={formData.budgetPerPerson}
              onChange={handleChange}
            />
            <span style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", marginTop: "4px", display: "block" }}>
              💡 หากไม่ได้ระบุราคา ระบบจะตรวจสอบราคาที่ควรตั้งให้ลูกค้าตามเนื้อจริงและราคาตลาดให้อัตโนมัติ
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">งบรวมทั้งกรุ๊ป (Auto Calculate)</label>
            <input type="text" className="form-control" value={
              (() => {
                const budget = parseFloat(formData.budgetPerPerson || "0");
                const count = parseInt(formData.travelerCount || "0");
                if (!budget || !count || isNaN(budget) || isNaN(count)) return "ระบบจะประเมินให้อัตโนมัติ";
                return (budget * count).toLocaleString() + " บาท";
              })()
            } readOnly />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginBottom: "40px" }}>
        <button type="button" className="btn-secondary" onClick={handleClear}>ล้างข้อมูล (Clear)</button>
        <button type="submit" className="btn-primary" disabled={loading} style={{ cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "กำลังสร้างแผนด้วย AI..." : "สร้างแบบร่าง (Generate Draft Plan)"}
        </button>
      </div>
    </form>
  );
}
