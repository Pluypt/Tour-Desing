"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CostPlannerTab from "@/components/builder/CostPlannerTab";
import CoverDesignerTab from "@/components/builder/CoverDesignerTab";
import DailyImageGallery from "@/components/images/DailyImageGallery";
import StatusSelector from "@/components/builder/StatusSelector";
import HeroCoverUploader from "@/components/builder/HeroCoverUploader";
import TripComBenchmarkWidget from "@/components/builder/TripComBenchmarkWidget";
import { POI_PRESETS } from "@/lib/presetLibrary";

const TABS = [
  { id: "info", label: "ข้อมูลพื้นฐาน" },
  { id: "itinerary", label: "แผนรายวัน" },
  { id: "conditions", label: "เงื่อนไข" },
  { id: "cost", label: "ต้นทุนและราคา" },
  { id: "benchmark", label: "📊 เปรียบเทียบ Trip.com" },
  { id: "images", label: "รูปภาพรายวัน" },
  { id: "cover", label: "ออกแบบหน้าปก" },
];

export default function TourBuilderClient({ initialPlan }: { initialPlan: any }) {
  const router = useRouter();
  const [plan, setPlan] = useState({
    ...initialPlan,
    Inclusions: initialPlan.Inclusions?.length > 0 ? initialPlan.Inclusions : [
      "ตั๋วเครื่องบินไป-กลับตามรายการ",
      "ที่พักตามระดับที่ระบุ",
      "รถรับส่งตามโปรแกรม",
      "อาหารตามที่ระบุในรายการ",
      "ค่าเข้าชมสถานที่ตามโปรแกรม",
      "ประกันการเดินทาง",
      "ทีมงานประสานงานตลอดทริป",
    ].map((text, i) => ({ id: `default-inc-${i}`, item_text: text, isNew: true })),
    Exclusions: initialPlan.Exclusions?.length > 0 ? initialPlan.Exclusions : [
      "ค่าใช้จ่ายส่วนตัว",
      "ค่าทำพาสปอร์ต",
      "ค่าธรรมเนียมวีซ่า (ถ้ามี)",
      "ค่าอาหารหรือเครื่องดื่มนอกเหนือจากรายการ",
      "ค่าทิปไกด์ / คนขับรถ",
      "ค่าใช้จ่ายจากเหตุสุดวิสัย",
    ].map((text, i) => ({ id: `default-exc-${i}`, item_text: text, isNew: true })),
  });
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedDayId, setSelectedDayId] = useState(initialPlan.TourDays?.[0]?.id || null);
  const [saving, setSaving] = useState(false);

  const selectedDayIndex = plan.TourDays.findIndex((d: any) => d.id === selectedDayId);
  const selectedDay = selectedDayIndex >= 0 ? plan.TourDays[selectedDayIndex] : null;

  const handleDayChange = (field: string, value: any) => {
    if (selectedDayIndex < 0) return;
    const updatedDays = [...plan.TourDays];
    updatedDays[selectedDayIndex] = { ...updatedDays[selectedDayIndex], [field]: value };
    setPlan({ ...plan, TourDays: updatedDays });
  };

  const handleActivityChange = (activityId: string, field: string, value: any) => {
    if (selectedDayIndex < 0) return;
    const updatedDays = [...plan.TourDays];
    const activities = [...updatedDays[selectedDayIndex].TourActivities];
    const actIndex = activities.findIndex((a: any) => a.id === activityId);
    if (actIndex >= 0) {
      activities[actIndex] = { ...activities[actIndex], [field]: value };
      updatedDays[selectedDayIndex].TourActivities = activities;
      setPlan({ ...plan, TourDays: updatedDays });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tour-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
        router.refresh();
      } else {
        alert("บันทึกข้อมูลไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleNavigatePreview = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tour-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        router.refresh();
      }
      router.push(`/preview/${plan.id}`);
    } catch (e) {
      console.error(e);
      router.push(`/preview/${plan.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{ flex: 1, marginRight: "20px" }}>
          <input
            type="text"
            value={plan.title || ""}
            onChange={e => setPlan({ ...plan, title: e.target.value })}
            style={{
              fontSize: "1.3rem", fontWeight: 700, color: "var(--pr-text-main)",
              border: "none", borderBottom: "2px solid transparent", background: "transparent",
              width: "100%", padding: "2px 0", outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => (e.target.style.borderBottomColor = "var(--pr-red)")}
            onBlur={e => (e.target.style.borderBottomColor = "transparent")}
            placeholder="ชื่อทริป"
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <p style={{ color: "var(--pr-text-muted)", margin: 0, fontSize: "0.85rem" }}>{plan.tour_code} • ลูกค้า: {plan.customer?.name}</p>
            <StatusSelector planId={plan.id} currentStatus={plan.status || "Draft"} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-secondary"
            style={{ backgroundColor: "#F3E5F5", color: "#6A1B9A", borderColor: "#CE93D8", display: "flex", alignItems: "center", gap: "6px" }}
            disabled={saving}
            onClick={async () => {
              if (!confirm("ต้องการให้ระบบ Gen เนื้อหาแผนการเดินทางใหม่ทั้งหมดสำหรับทริปนี้หรือไม่?")) return;
              setSaving(true);
              try {
                const res = await fetch(`/api/tour-plans/${plan.id}/regenerate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data.success) {
                  alert("Gen เนื้อหาเรียบร้อยแล้ว!");
                  window.location.reload();
                } else {
                  alert(data.error || "เกิดข้อผิดพลาดในการ Gen เนื้อหาใหม่");
                }
              } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดในการ Gen เนื้อหาใหม่");
              } finally {
                setSaving(false);
              }
            }}
          >
            ✨ Gen เนื้อหาใหม่ทั้งหมด
          </button>
          <button
            className="btn-secondary"
            onClick={handleNavigatePreview}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            👁️ พรีวิว & ดาวน์โหลด
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid var(--border-color)", marginBottom: "20px" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? "var(--pr-red)" : "var(--pr-text-muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--pr-red)" : "2px solid transparent",
              marginBottom: "-2px",
              fontSize: "0.95rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: ข้อมูลพื้นฐาน */}
      {activeTab === "info" && (
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "30px" }}>
          <h2 style={{ marginBottom: "24px", fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>ข้อมูลพื้นฐาน (General Info)</h2>
          <p style={{ color: "var(--pr-text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
            ข้อมูลในส่วนนี้จะถูกนำไปแสดงที่ตารางสรุปในหน้าแรกของเอกสาร (พรีวิวหน้าปก)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>รหัสทัวร์</label>
              <input type="text" className="form-control" value={plan.tour_code || ""} onChange={e => setPlan({...plan, tour_code: e.target.value})} placeholder="เช่น PR-จีน-7340" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>ระยะเวลา (วัน)</label>
              <input type="number" className="form-control" value={plan.duration || ""} onChange={e => setPlan({...plan, duration: parseInt(e.target.value) || null})} placeholder="จำนวนวัน" />
            </div>
            
            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>จำนวนผู้เดินทาง (ท่าน)</label>
              <input type="number" className="form-control" value={plan.traveler_count || ""} onChange={e => setPlan({...plan, traveler_count: parseInt(e.target.value) || null})} placeholder="จำนวนคน" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>ประเภททริป</label>
              <input type="text" className="form-control" value={plan.trip_type || ""} onChange={e => setPlan({...plan, trip_type: e.target.value})} placeholder="เช่น Private Tour, Group Tour" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>สายการบิน</label>
              <input type="text" className="form-control" value={plan.airline || ""} onChange={e => setPlan({...plan, airline: e.target.value})} placeholder="ชื่อสายการบิน" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>เส้นทางบิน</label>
              <input type="text" className="form-control" value={plan.flight_route || ""} onChange={e => setPlan({...plan, flight_route: e.target.value})} placeholder="เช่น BKK - NRT" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>เที่ยวบินขาไป (Outbound Flight)</label>
              <input type="text" className="form-control" value={plan.outbound_flight || ""} onChange={e => setPlan({...plan, outbound_flight: e.target.value})} placeholder="เช่น HB296 BKK 01:55 - 06:00 HKG" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>เที่ยวบินขากลับ (Return Flight)</label>
              <input type="text" className="form-control" value={plan.return_flight || ""} onChange={e => setPlan({...plan, return_flight: e.target.value})} placeholder="เช่น HB295 HKG 22:15 - 00:15 BKK" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>ระดับโรงแรมที่พัก</label>
              <input type="text" className="form-control" value={plan.hotel_level || ""} onChange={e => setPlan({...plan, hotel_level: e.target.value})} placeholder="เช่น 4 ดาว, 5 ดาว" />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>วันที่เริ่มต้น</label>
              <input type="date" className="form-control" value={plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : ""} onChange={e => setPlan({...plan, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})} />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "6px", display: "block" }}>วันที่สิ้นสุด</label>
              <input type="date" className="form-control" value={plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : ""} onChange={e => setPlan({...plan, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})} />
            </div>

          </div>
        </div>
      )}

      {/* Tab: แผนรายวัน */}
      {activeTab === "itinerary" && (
        <div style={{ display: "flex", gap: "20px", height: "calc(100vh - 220px)" }}>
          {/* Day List */}
          <div className="card" style={{ width: "280px", display: "flex", flexDirection: "column", overflowY: "auto", margin: 0 }}>
            <h3 style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)", fontSize: "1rem" }}>แผนการเดินทาง</h3>

            {/* Hero Cover Uploader */}
            <HeroCoverUploader
              planId={plan.id}
              heroImageUrl={plan.hero_image_url || null}
              onUpdate={(url) => setPlan({ ...plan, hero_image_url: url })}
            />

            {/* Selling Price */}
            <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", display: "block", marginBottom: "4px" }}>ราคาขายต่อท่าน (บาท)</label>
              <input
                type="number"
                className="form-control"
                value={plan.selling_price_per_person || ""}
                onChange={e => {
                  const price = parseFloat(e.target.value) || 0;
                  const total = price * (plan.traveler_count || 1);
                  setPlan({ ...plan, selling_price_per_person: price, total_selling_price: total });
                }}
                placeholder="0"
                style={{ fontSize: "0.85rem", padding: "6px 8px" }}
              />
              {plan.selling_price_per_person > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--pr-red)", marginTop: "4px", fontWeight: 600 }}>
                  รวม {plan.traveler_count} ท่าน = {((plan.selling_price_per_person || 0) * (plan.traveler_count || 1)).toLocaleString()} บาท
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {plan.TourDays.map((day: any) => (
                <div
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    border: `1px solid ${selectedDayId === day.id ? "var(--pr-red)" : "var(--border-color)"}`,
                    backgroundColor: selectedDayId === day.id ? "rgba(211, 47, 47, 0.05)" : "transparent",
                  }}
                >
                  <div style={{ fontWeight: "bold", color: selectedDayId === day.id ? "var(--pr-red)" : "var(--pr-text-main)", fontSize: "0.9rem" }}>
                    วันที่ {day.day_number}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--pr-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {day.day_title || "ไม่มีหัวข้อ"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day Editor */}
          <div className="card" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
            {selectedDay ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ margin: 0 }}>วันที่ {selectedDay.day_number}</h2>
                  <div style={{ fontSize: "0.9rem", color: "var(--pr-text-muted)" }}>
                    {new Date(selectedDay.actual_date).toLocaleDateString("th-TH")}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">หัวข้อวัน</label>
                    <input type="text" className="form-control" value={selectedDay.day_title || ""} onChange={e => handleDayChange("day_title", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">เมือง</label>
                    <input type="text" className="form-control" value={selectedDay.city || ""} onChange={e => handleDayChange("city", e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: "25px", padding: "15px", backgroundColor: "var(--pr-gray-100)", borderRadius: "var(--radius-sm)" }}>
                  <h3 style={{ fontSize: "0.95rem", marginBottom: "10px" }}>อาหาร & ที่พัก</h3>
                  <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
                    {[["breakfast_included", "อาหารเช้า"], ["lunch_included", "อาหารเที่ยง"], ["dinner_included", "อาหารค่ำ"]].map(([field, label]) => (
                      <label key={field} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                        <input type="checkbox" checked={selectedDay[field]} onChange={e => handleDayChange(field, e.target.checked)} /> {label}
                      </label>
                    ))}
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">โรงแรม</label>
                    <input type="text" className="form-control" value={selectedDay.hotel_name || ""} onChange={e => handleDayChange("hotel_name", e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>กิจกรรม</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: "5px 10px", fontSize: "0.82rem", backgroundColor: "#E3F2FD", color: "#1565C0", borderColor: "#90CAF9" }}
                      onClick={async () => {
                        if (!selectedDay) return;
                        if (!confirm(`ให้ AI รีเสิชแลนด์มาร์กสถานที่ท่องเที่ยวจริงประจำเมืองสำหรับ วันที่ ${selectedDay.day_number}?`)) return;
                        setSaving(true);
                        try {
                          const res = await fetch(`/api/tour-plans/${plan.id}/auto-research-day`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dayId: selectedDay.id, dayNumber: selectedDay.day_number }),
                          });
                          const data = await res.json();
                          if (data.success && data.activities) {
                            const updatedDays = [...plan.TourDays];
                            updatedDays[selectedDayIndex].TourActivities = data.activities;
                            setPlan({ ...plan, TourDays: updatedDays });
                            alert("รีเสิชแลนด์มาร์กสถานที่จริงสำเร็จ!");
                          } else {
                            alert("เกิดข้อผิดพลาดในการรีเสิชสถานที่");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("เกิดข้อผิดพลาดในการรีเสิชสถานที่");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      ✨ AI รีเสิชแลนด์มาร์กจริง
                    </button>

                    <select
                      className="form-control"
                      style={{ fontSize: "0.82rem", padding: "4px 8px", width: "auto" }}
                      onChange={e => {
                        const idx = parseInt(e.target.value);
                        if (isNaN(idx)) return;
                        const preset = POI_PRESETS[idx];
                        if (!preset) return;

                        const updatedDays = [...plan.TourDays];
                        updatedDays[selectedDayIndex].TourActivities.push({
                          id: "new-poi-" + Date.now(),
                          time_text: preset.recommendedTime || "เช้า",
                          activity_title: preset.title,
                          activity_description: preset.description,
                          location_name: preset.title,
                          isNew: true,
                        });
                        setPlan({ ...plan, TourDays: updatedDays });
                        e.target.value = "";
                      }}
                    >
                      <option value="">+ เลือกสถานที่จากคลัง POI</option>
                      {POI_PRESETS.map((preset, idx) => (
                        <option key={idx} value={idx}>
                          [{preset.city}] {preset.title}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-secondary"
                      style={{ padding: "5px 12px", fontSize: "0.85rem" }}
                      onClick={() => {
                        const updatedDays = [...plan.TourDays];
                        updatedDays[selectedDayIndex].TourActivities.push({
                          id: "new-" + Date.now(),
                          time_text: "",
                          activity_title: "",
                          activity_description: "",
                          isNew: true,
                        });
                        setPlan({ ...plan, TourDays: updatedDays });
                      }}
                    >
                      + เพิ่มกิจกรรมเอง
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedDay.TourActivities.map((activity: any, index: number) => (
                    <div key={activity.id} style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", gap: "12px" }}>
                      <div style={{ width: "90px" }}>
                        <input type="text" className="form-control" value={activity.time_text || ""} onChange={e => handleActivityChange(activity.id, "time_text", e.target.value)} placeholder="ช่วงเวลา" style={{ fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input type="text" className="form-control" value={activity.activity_title || ""} onChange={e => handleActivityChange(activity.id, "activity_title", e.target.value)} placeholder="ชื่อกิจกรรม" style={{ fontWeight: "bold", fontSize: "0.9rem" }} />
                        <textarea className="form-control" value={activity.activity_description || ""} onChange={e => handleActivityChange(activity.id, "activity_description", e.target.value)} rows={2} placeholder="รายละเอียด" style={{ fontSize: "0.85rem" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                          <button
                            title="เลื่อนขึ้น"
                            style={{ color: "#555", fontSize: "0.85rem", border: "none", background: "none", cursor: index > 0 ? "pointer" : "not-allowed", opacity: index > 0 ? 1 : 0.3, display: "flex", alignItems: "center", gap: "4px" }}
                            disabled={index === 0}
                            onClick={() => {
                              const updatedDays = [...plan.TourDays];
                              const activities = [...updatedDays[selectedDayIndex].TourActivities];
                              [activities[index - 1], activities[index]] = [activities[index], activities[index - 1]];
                              updatedDays[selectedDayIndex].TourActivities = activities;
                              setPlan({ ...plan, TourDays: updatedDays });
                            }}
                          >
                            ▲ <span style={{ display: "none" }}>เลื่อนขึ้น</span>
                          </button>
                          <button
                            title="เลื่อนลง"
                            style={{ color: "#555", fontSize: "0.85rem", border: "none", background: "none", cursor: index < selectedDay.TourActivities.length - 1 ? "pointer" : "not-allowed", opacity: index < selectedDay.TourActivities.length - 1 ? 1 : 0.3, display: "flex", alignItems: "center", gap: "4px" }}
                            disabled={index === selectedDay.TourActivities.length - 1}
                            onClick={() => {
                              const updatedDays = [...plan.TourDays];
                              const activities = [...updatedDays[selectedDayIndex].TourActivities];
                              [activities[index + 1], activities[index]] = [activities[index], activities[index + 1]];
                              updatedDays[selectedDayIndex].TourActivities = activities;
                              setPlan({ ...plan, TourDays: updatedDays });
                            }}
                          >
                            ▼ <span style={{ display: "none" }}>เลื่อนลง</span>
                          </button>
                          <button
                            style={{ color: "var(--pr-red)", fontSize: "0.85rem", border: "none", background: "none", cursor: "pointer", marginLeft: "10px" }}
                            onClick={() => {
                              const updatedDays = [...plan.TourDays];
                              updatedDays[selectedDayIndex].TourActivities = updatedDays[selectedDayIndex].TourActivities.filter((a: any) => a.id !== activity.id);
                              setPlan({ ...plan, TourDays: updatedDays });
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--pr-text-muted)" }}>
                กรุณาเลือกวันที่ต้องการแก้ไข
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: ต้นทุนและราคา */}
      {activeTab === "cost" && (
        <div className="card">
          <CostPlannerTab
            planId={plan.id}
            travelerCount={plan.traveler_count || 1}
            duration={plan.duration || 1}
            city={plan.main_city || "คุนหมิง"}
            country={plan.country || "จีน"}
            hotelLevel={plan.hotel_level || "4 ดาว"}
            sellingPricePerPerson={plan.selling_price_per_person || 0}
          />
        </div>
      )}

      {/* Tab: เปรียบเทียบ Trip.com */}
      {activeTab === "benchmark" && (
        <div className="card">
          <TripComBenchmarkWidget
            city={plan.main_city || "คุนหมิง"}
            country={plan.country || "จีน"}
            duration={plan.duration || 4}
            hotelLevel={plan.hotel_level || "4 ดาว"}
            currentSellingPrice={plan.selling_price_per_person || 0}
            travelerCount={plan.traveler_count || 2}
          />
        </div>
      )}

      {/* Tab: เงื่อนไข */}
      {activeTab === "conditions" && (
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "30px" }}>
          <h2 style={{ marginBottom: "24px", fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>เงื่อนไข (Inclusions & Exclusions)</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            {/* Inclusions */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--pr-red)", margin: 0 }}>✓ สิ่งที่รวมในราคา</h3>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => {
                    const newInclusions = [...(plan.Inclusions || [])];
                    newInclusions.push({ id: "new-inc-" + Date.now(), item_text: "", isNew: true });
                    setPlan({ ...plan, Inclusions: newInclusions });
                  }}
                >+ เพิ่ม</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(plan.Inclusions || []).map((inc: any, idx: number) => (
                  <div key={inc.id} style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={inc.item_text}
                      onChange={e => {
                        const newInclusions = [...plan.Inclusions];
                        newInclusions[idx].item_text = e.target.value;
                        setPlan({ ...plan, Inclusions: newInclusions });
                      }}
                    />
                    <button
                      style={{ color: "var(--pr-red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                      onClick={() => {
                        const newInclusions = plan.Inclusions.filter((_: any, i: number) => i !== idx);
                        setPlan({ ...plan, Inclusions: newInclusions });
                      }}
                    >ลบ</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1rem", color: "#555", margin: 0 }}>✗ สิ่งที่ไม่รวมในราคา</h3>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => {
                    const newExclusions = [...(plan.Exclusions || [])];
                    newExclusions.push({ id: "new-exc-" + Date.now(), item_text: "", isNew: true });
                    setPlan({ ...plan, Exclusions: newExclusions });
                  }}
                >+ เพิ่ม</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(plan.Exclusions || []).map((exc: any, idx: number) => (
                  <div key={exc.id} style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={exc.item_text}
                      onChange={e => {
                        const newExclusions = [...plan.Exclusions];
                        newExclusions[idx].item_text = e.target.value;
                        setPlan({ ...plan, Exclusions: newExclusions });
                      }}
                    />
                    <button
                      style={{ color: "var(--pr-red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                      onClick={() => {
                        const newExclusions = plan.Exclusions.filter((_: any, i: number) => i !== idx);
                        setPlan({ ...plan, Exclusions: newExclusions });
                      }}
                    >ลบ</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: รูปภาพรายวัน */}
      {activeTab === "images" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>รูปภาพรายวัน</h2>
            <button
              className="btn-secondary"
              style={{ padding: "7px 16px", fontSize: "0.85rem" }}
              onClick={async () => {
                if (!confirm("สร้าง keywords สำหรับทุกวันด้วย AI?")) return;
                const res = await fetch(`/api/tour-plans/${plan.id}/generate-day-image-keywords`, { method: "POST" });
                const data = await res.json();
                if (data.success) {
                  alert(`สร้าง keywords สำเร็จ ${data.results.length} วัน — กด "ค้นหารูปภาพ" ในแต่ละวันได้เลย`);
                  setPlan((prev: typeof plan) => ({ ...prev, _imageKeywords: data.results }));
                } else {
                  alert("สร้าง keywords ไม่สำเร็จ");
                }
              }}
            >
              ✨ Generate Keywords ทุกวัน
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {plan.TourDays.map((day: any) => {
              const dayKeywords = plan._imageKeywords?.find((k: any) => k.day_number === day.day_number)?.image_keywords;
              return (
                <DailyImageGallery
                  key={day.id}
                  dayId={day.id}
                  dayNumber={day.day_number}
                  dayTitle={day.day_title}
                  keywords={dayKeywords}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: ออกแบบหน้าปก */}
      {activeTab === "cover" && (
        <div className="card">
          <CoverDesignerTab planId={plan.id} />
        </div>
      )}
    </>
  );
}
