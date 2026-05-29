"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TourRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [originalPlanFile, setOriginalPlanFile] = useState<{mimeType: string, data: string} | null>(null);
  const [formData, setFormData] = useState({
    // Section A
    customerName: "",
    phone: "",
    lineId: "",
    customerType: "Family",
    travelerCount: "",
    ageRange: "",
    customerNote: "",
    // Section B
    country: "",
    mainCity: "",
    secondaryCity: "",
    startDate: "",
    endDate: "",
    duration: "", // calculated
    tripType: "Private Tour",
    tourCode: "",
    title: "",
    theme: "Nature",
    // Budget & Level
    hotelLevel: "4 Star",
    budgetPerPerson: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      setFormData(prev => ({ ...prev, duration: diffDays.toString() }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.customerName || !formData.country || !formData.mainCity || !formData.startDate || !formData.travelerCount || !formData.duration) {
      alert("กรุณากรอกข้อมูลที่จำเป็นก่อนสร้างแพลนทัวร์");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, originalPlanFile })
      });
      
      const data = await res.json();
      if (data.success && data.planId) {
        router.push(`/builder/${data.planId}`);
      } else {
        alert("Failed to generate plan");
      }
    } catch (error) {
      console.error(error);
      alert("Error generating plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 0 }}>
      <h1 className="page-title">Tour Request Form</h1>
      
      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Section A: ข้อมูลลูกค้า</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">ชื่อลูกค้า *</label>
            <input type="text" className="form-control" name="customerName" value={formData.customerName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">เบอร์โทร</label>
            <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
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
            <input type="number" className="form-control" name="travelerCount" value={formData.travelerCount} onChange={handleChange} required />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Section B: ข้อมูลทริปหลัก</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">ประเทศปลายทาง *</label>
            <input type="text" className="form-control" name="country" value={formData.country} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">เมืองหลัก *</label>
            <input type="text" className="form-control" name="mainCity" value={formData.mainCity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">วันที่เดินทาง เริ่มต้น *</label>
            <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleChange} onBlur={calculateDuration} required />
          </div>
          <div className="form-group">
            <label className="form-label">วันที่เดินทาง สิ้นสุด *</label>
            <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleChange} onBlur={calculateDuration} required />
          </div>
          <div className="form-group">
            <label className="form-label">จำนวนวัน * (Auto Calculate)</label>
            <input type="text" className="form-control" name="duration" value={formData.duration} onChange={handleChange} readOnly />
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setOriginalPlanFile(null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  setOriginalPlanFile({ mimeType: file.type, data: base64 });
                };
                reader.readAsDataURL(file);
              }} 
            />
          </div>
        </div>
      </div>

      {/* For MVP, combining C-G into simple requirements field to make it usable */}
      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>ความต้องการเฉพาะ / โรงแรม / อาหาร</h2>
        <div className="form-group">
          <label className="form-label">ระดับโรงแรม</label>
          <select className="form-control" name="hotelLevel" value={formData.hotelLevel} onChange={handleChange}>
            <option value="3 Star">3 ดาว</option>
            <option value="4 Star">4 ดาว</option>
            <option value="5 Star">5 ดาว</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">หมายเหตุเพิ่มเติม (ความต้องการอื่นๆ, สถานที่ที่อยากไป/ไม่อยากไป, ข้อจำกัดอาหาร)</label>
          <textarea className="form-control" name="customerNote" value={formData.customerNote} onChange={handleChange} rows={5}></textarea>
        </div>
      </div>

      {/* Section G: Price Calculation */}
      <div className="card">
        <h2 style={{ marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>ราคาและงบประมาณ</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">งบประมาณต่อคน</label>
            <input type="number" className="form-control" name="budgetPerPerson" value={formData.budgetPerPerson} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">งบรวมทั้งกรุ๊ป (Auto Calculate)</label>
            <input type="text" className="form-control" value={
              (() => {
                const budget = parseFloat(formData.budgetPerPerson || "0");
                const count = parseInt(formData.travelerCount || "0");
                if (!budget || !count || isNaN(budget) || isNaN(count)) return "0";
                return (budget * count).toLocaleString();
              })()
            } readOnly />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginBottom: "40px" }}>
        <button className="btn-secondary" onClick={() => setFormData({} as any)}>ล้างข้อมูล (Clear)</button>
        <button className="btn-secondary">บันทึกข้อมูล (Save)</button>
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "กำลังสร้างแผนด้วย AI..." : "สร้างแบบร่าง (Generate Draft Plan)"}
        </button>
      </div>
    </div>
  );
}
