"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TourBuilderClient({ initialPlan }: { initialPlan: any }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
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
        body: JSON.stringify(plan)
      });
      if (res.ok) {
        alert("Saved successfully!");
        router.refresh();
      } else {
        alert("Failed to save changes");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{plan.title}</h1>
          <p style={{ color: "var(--pr-text-muted)" }}>{plan.tour_code} • Customer: {plan.customer?.name}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/preview/${plan.id}`} className="btn-secondary">พรีวิว & ดาวน์โหลด</Link>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", height: "calc(100vh - 150px)" }}>
        {/* Left Sidebar: Days List */}
        <div className="card" style={{ width: "300px", display: "flex", flexDirection: "column", overflowY: "auto", margin: 0 }}>
          <h3 style={{ marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
            แผนการเดินทาง
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {plan.TourDays.map((day: any) => (
              <div 
                key={day.id} 
                onClick={() => setSelectedDayId(day.id)}
                style={{
                  padding: "15px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  border: `1px solid ${selectedDayId === day.id ? "var(--pr-red)" : "var(--border-color)"}`,
                  backgroundColor: selectedDayId === day.id ? "rgba(211, 47, 47, 0.05)" : "transparent",
                }}
              >
                <div style={{ fontWeight: "bold", color: selectedDayId === day.id ? "var(--pr-red)" : "var(--pr-text-main)" }}>
                  วันที่ {day.day_number}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--pr-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {day.day_title || "ไม่มีหัวข้อ"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Day Editor */}
        <div className="card" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          {selectedDay ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>วันที่ {selectedDay.day_number}</h2>
                <div style={{ fontSize: "0.9rem", color: "var(--pr-text-muted)" }}>
                  {new Date(selectedDay.actual_date).toLocaleDateString('th-TH')}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div className="form-group">
                  <label className="form-label">หัวข้อ</label>
                  <input type="text" className="form-control" value={selectedDay.day_title || ""} onChange={(e) => handleDayChange("day_title", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">เมือง</label>
                  <input type="text" className="form-control" value={selectedDay.city || ""} onChange={(e) => handleDayChange("city", e.target.value)} />
                </div>
              </div>
              
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "var(--pr-gray-100)", borderRadius: "var(--radius-sm)" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>อาหาร & ที่พัก</h3>
                <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input type="checkbox" checked={selectedDay.breakfast_included} onChange={(e) => handleDayChange("breakfast_included", e.target.checked)} /> อาหารเช้า
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input type="checkbox" checked={selectedDay.lunch_included} onChange={(e) => handleDayChange("lunch_included", e.target.checked)} /> อาหารเที่ยง
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input type="checkbox" checked={selectedDay.dinner_included} onChange={(e) => handleDayChange("dinner_included", e.target.checked)} /> อาหารค่ำ
                  </label>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">โรงแรม</label>
                  <input type="text" className="form-control" value={selectedDay.hotel_name || ""} onChange={(e) => handleDayChange("hotel_name", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ fontSize: "1.1rem" }}>กิจกรรม</h3>
                <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: "0.9rem" }} onClick={() => {
                  const updatedDays = [...plan.TourDays];
                  updatedDays[selectedDayIndex].TourActivities.push({
                    id: "new-" + Date.now(),
                    time_text: "",
                    activity_title: "",
                    activity_description: "",
                    isNew: true
                  });
                  setPlan({ ...plan, TourDays: updatedDays });
                }}>+ เพิ่มกิจกรรม</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {selectedDay.TourActivities.map((activity: any, index: number) => (
                  <div key={activity.id} style={{ border: "1px solid var(--border-color)", padding: "15px", borderRadius: "var(--radius-sm)", display: "flex", gap: "15px" }}>
                    <div style={{ width: "100px" }}>
                      <input type="text" className="form-control" value={activity.time_text || ""} onChange={(e) => handleActivityChange(activity.id, "time_text", e.target.value)} placeholder="เวลา" />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input type="text" className="form-control" value={activity.activity_title || ""} onChange={(e) => handleActivityChange(activity.id, "activity_title", e.target.value)} placeholder="ชื่อกิจกรรม" style={{ fontWeight: "bold" }} />
                      <textarea className="form-control" value={activity.activity_description || ""} onChange={(e) => handleActivityChange(activity.id, "activity_description", e.target.value)} rows={3} placeholder="รายละเอียด"></textarea>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--pr-white)" }}>เพิ่มรูปภาพ</button>
                        </div>
                        <button style={{ color: "var(--pr-red)", fontSize: "0.9rem", border: "none", background: "none", cursor: "pointer" }} onClick={() => {
                          const updatedDays = [...plan.TourDays];
                          updatedDays[selectedDayIndex].TourActivities = updatedDays[selectedDayIndex].TourActivities.filter((a: any) => a.id !== activity.id);
                          setPlan({ ...plan, TourDays: updatedDays });
                        }}>ลบ</button>
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
    </>
  );
}
