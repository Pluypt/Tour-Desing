import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

export default async function CustomerTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      TourDays: {
        orderBy: { sort_order: "asc" },
        include: {
          TourActivities: { orderBy: { sort_order: "asc" } },
          TourDayImages: {
            where: { is_selected: true },
            orderBy: { sort_order: "asc" }
          },
        },
      },
      Inclusions: { orderBy: { sort_order: "asc" } },
      Exclusions: { orderBy: { sort_order: "asc" } },
    },
  });

  if (!plan) return notFound();

  const heroImageUrl = plan.hero_image_url || "/images/placeholder-cover.jpg";
  const nights = plan.duration ? Math.max(0, plan.duration - 1) : 0;

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    const date = new Date(d);
    if (date.getFullYear() > 2500) date.setFullYear(date.getFullYear() - 543);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };

  const renderRichText = (text: string | null) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#D32F2F", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "100vh", fontFamily: "'Inter', 'Sarabun', sans-serif", color: "#222", paddingBottom: "80px" }}>
      {/* 1. Mobile & Web Header Hero Banner */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "320px",
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url(${heroImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "24px 20px",
          color: "white",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div style={{ display: "inline-block", backgroundColor: "#D32F2F", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
            {plan.duration} วัน {nights} คืน | {plan.trip_type || "Private Package"}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px", lineHeight: "1.3" }}>
            {plan.title || "โปรแกรมท่องเที่ยว"}
          </h1>
          <div style={{ fontSize: "13px", opacity: 0.9, display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span>📅 {formatDate(plan.start_date)} - {formatDate(plan.end_date)}</span>
            <span>👥 {plan.traveler_count} ท่าน</span>
            {plan.airline && <span>✈️ {plan.airline}</span>}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: "800px", margin: "20px auto", padding: "0 16px" }}>
        
        {/* Flight & Package Highlights Bar */}
        <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0D47A1", margin: "0 0 12px" }}>✈️ ข้อมูลการเดินทาง & เที่ยวบิน</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
            <div style={{ backgroundColor: "#FFF3E0", padding: "10px 14px", borderRadius: "10px", borderLeft: "4px solid #F57C00" }}>
              <div style={{ fontWeight: 700, color: "#E65100" }}>🛫 เที่ยวบินขาไป</div>
              <div style={{ color: "#333", marginTop: "4px" }}>{plan.outbound_flight || "BKK -> Destination"}</div>
            </div>
            <div style={{ backgroundColor: "#FFF3E0", padding: "10px 14px", borderRadius: "10px", borderLeft: "4px solid #F57C00" }}>
              <div style={{ fontWeight: 700, color: "#E65100" }}>🛬 เที่ยวบินขากลับ</div>
              <div style={{ color: "#333", marginTop: "4px" }}>{plan.return_flight || "Destination -> BKK"}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", fontSize: "12px", color: "#666", paddingTop: "10px", borderTop: "1px solid #eee" }}>
            <span>🧳 น้ำหนักกระเป๋า: 20 Kg</span>
            <span>🏨 ระดับโรงแรม: {plan.hotel_level || "4 ดาว"}</span>
          </div>
        </div>

        {/* Price Box if Available */}
        {plan.selling_price_per_person && plan.selling_price_per_person > 0 && (
          <div style={{ backgroundColor: "#E3F2FD", border: "1px solid #90CAF9", borderRadius: "14px", padding: "16px 20px", textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", color: "#1565C0", fontWeight: 600 }}>ราคาแพ็กเกจเสนอพิเศษ</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#D32F2F", margin: "4px 0" }}>
              ฿{plan.selling_price_per_person.toLocaleString()}{" "}
              <span style={{ fontSize: "14px", fontWeight: 400, color: "#555" }}>/ ท่าน</span>
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              ราคารวมทั้งคณะ ({plan.traveler_count || 1} ท่าน): ฿{((plan.selling_price_per_person || 0) * (plan.traveler_count || 1)).toLocaleString()} บาท
            </div>
          </div>
        )}

        {/* Daily Itinerary Sections */}
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0D47A1", marginBottom: "16px" }}>
          📍 แผนการเดินทางรายวัน (Daily Itinerary)
        </h2>

        {plan.TourDays.map((day: any) => {
          const selectedImages = day.TourDayImages ? day.TourDayImages.filter((img: any) => img.is_selected) : [];
          const meals = [
            day.breakfast_included ? "เช้า 🍽️" : null,
            day.lunch_included ? "กลางวัน 🍽️" : null,
            day.dinner_included ? "เย็น 🍽️" : null,
          ].filter(Boolean).join(" | ") || "อิสระตามอัธยาศัย";

          return (
            <div key={day.id} style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {/* Day Header Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ backgroundColor: "#D32F2F", color: "white", borderRadius: "16px", padding: "4px 14px", fontWeight: 800, fontSize: "13px" }}>
                  DAY {day.day_number}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#222" }}>
                  {day.day_title || `วันที่ ${day.day_number}`}
                </span>
              </div>

              {/* Day Hero Image */}
              {selectedImages.length > 0 && (
                <div style={{ marginBottom: "16px", borderRadius: "12px", overflow: "hidden", height: "200px" }}>
                  <img src={selectedImages[0].image_url} alt={day.day_title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {/* Timeline Activities */}
              <div style={{ paddingLeft: "16px", borderLeft: "2px solid #E0E0E0", marginLeft: "6px", marginBottom: "16px" }}>
                {day.TourActivities.map((activity: any) => (
                  <div key={activity.id} style={{ marginBottom: "16px", position: "relative" }}>
                    <div style={{ position: "absolute", left: "-21px", top: "5px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#D32F2F" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                        {activity.time_text && (
                          <span style={{ color: "#D32F2F", fontWeight: 700, fontSize: "12px" }}>{activity.time_text}</span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0D47A1" }}>{activity.activity_title}</span>
                      </div>
                      {/* Google Maps Button */}
                      {(activity.location_name || activity.activity_title) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location_name || activity.activity_title || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "11px", color: "#1976D2", backgroundColor: "#E3F2FD",
                            padding: "2px 8px", borderRadius: "10px", textDecoration: "none", fontWeight: 600
                          }}
                        >
                          📍 แผนที่ Maps
                        </a>
                      )}
                    </div>
                    {activity.activity_description && (
                      <div style={{ color: "#555", fontSize: "13px", lineHeight: "1.6", marginTop: "4px" }}>
                        {renderRichText(activity.activity_description)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Meals & Hotel Footer */}
              <div style={{ backgroundColor: "#FAF3E0", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div><strong>🍽️ อาหาร:</strong> {meals}</div>
                <div><strong>🏨 ที่พัก:</strong> {day.hotel_name || "โรงแรมระดับมาตรฐาน"}</div>
              </div>
            </div>
          );
        })}

        {/* Inclusions & Exclusions */}
        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0D47A1", margin: "0 0 14px" }}>📋 เงื่อนไขแพ็กเกจทัวร์</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "8px" }}>✓ รายการที่รวมในแพ็กเกจ</div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: "1.6" }}>
                {plan.Inclusions.map((inc: any) => <li key={inc.id}>{inc.item_text}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#C62828", marginBottom: "8px" }}>✗ รายการที่ไม่รวมในแพ็กเกจ</div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: "1.6" }}>
                {plan.Exclusions.map((exc: any) => <li key={exc.id}>{exc.item_text}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA Bar for Customer Mobile & Desktop */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTop: "1px solid #E0E0E0",
          padding: "12px 20px",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
          zIndex: 1000,
        }}
      >
        <div style={{ maxWidth: "800px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#777" }}>สอบถามรายละเอียด / ยืนยันการจอง</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#D32F2F" }}>PR GLOBAL TRAVEL GROUP</div>
          </div>
          <a
            href="https://line.me"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#25D366",
              color: "white",
              padding: "10px 20px",
              borderRadius: "24px",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 10px rgba(37,211,102,0.3)",
            }}
          >
            💬 ติดต่อจองทริปนี้ผ่าน LINE
          </a>
        </div>
      </div>
    </div>
  );
}
