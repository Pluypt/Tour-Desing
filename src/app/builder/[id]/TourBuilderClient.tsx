"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CostPlannerTab from "@/components/builder/CostPlannerTab";
import CoverDesignerTab from "@/components/builder/CoverDesignerTab";
import DailyImageGallery from "@/components/images/DailyImageGallery";
import StatusSelector from "@/components/builder/StatusSelector";
import HeroCoverUploader from "@/components/builder/HeroCoverUploader";

const TABS = [
  { id: "itinerary", label: "แผนรายวัน" },
  { id: "cost", label: "ต้นทุนและราคา" },
  { id: "images", label: "รูปภาพรายวัน" },
  { id: "cover", label: "ออกแบบหน้าปก" },
];

export default function TourBuilderClient({ initialPlan }: { initialPlan: any }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
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
      if (res.ok) { alert("Saved successfully!"); router.refresh(); }
      else { alert("Failed to save changes"); }
    } catch (e) {
      console.error(e);
      alert("Error saving plan");
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
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/preview/${plan.id}`} className="btn-secondary">พรีวิว & ดาวน์โหลด</Link>
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
                    + เพิ่มกิจกรรม
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedDay.TourActivities.map((activity: any) => (
                    <div key={activity.id} style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", gap: "12px" }}>
                      <div style={{ width: "90px" }}>
                        <input type="text" className="form-control" value={activity.time_text || ""} onChange={e => handleActivityChange(activity.id, "time_text", e.target.value)} placeholder="เวลา" style={{ fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input type="text" className="form-control" value={activity.activity_title || ""} onChange={e => handleActivityChange(activity.id, "activity_title", e.target.value)} placeholder="ชื่อกิจกรรม" style={{ fontWeight: "bold", fontSize: "0.9rem" }} />
                        <textarea className="form-control" value={activity.activity_description || ""} onChange={e => handleActivityChange(activity.id, "activity_description", e.target.value)} rows={2} placeholder="รายละเอียด" style={{ fontSize: "0.85rem" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            style={{ color: "var(--pr-red)", fontSize: "0.85rem", border: "none", background: "none", cursor: "pointer" }}
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
          />
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
