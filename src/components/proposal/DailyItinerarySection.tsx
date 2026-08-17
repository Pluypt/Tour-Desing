import React from "react";

const PR_RED = "#D32F2F";
const PR_BLUE = "#0D47A1";

type Activity = {
  id: string;
  time_text: string | null;
  activity_title: string | null;
  activity_description: string | null;
  location_name?: string | null;
};

type DayImage = {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  caption: string | null;
  is_selected: boolean;
  sort_order: number;
};

type TourDay = {
  id: string;
  day_number: number;
  actual_date: Date | null;
  day_title: string | null;
  city: string | null;
  hotel_name: string | null;
  breakfast_included: boolean;
  lunch_included: boolean;
  dinner_included: boolean;
  TourActivities: Activity[];
  TourDayImages?: DayImage[];
};

// Helper to render markdown-style **bold text** as colored strong elements
function renderRichText(text: string | null) {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      return (
        <strong key={i} style={{ color: PR_RED, fontWeight: 700 }}>
          {content}
        </strong>
      );
    }
    return part;
  });
}

export default function DailyItinerarySection({ days, hotelLevel }: { days: TourDay[]; hotelLevel?: string | null }) {
  return (
    <div className="daily-itinerary-container" style={{ breakInside: "auto", pageBreakInside: "auto" }}>
      <h2
        className="page-break-avoid"
        style={{
          color: PR_BLUE,
          fontSize: "16px",
          fontWeight: 800,
          borderBottom: `2px solid ${PR_RED}`,
          paddingBottom: "6px",
          marginBottom: "20px",
          breakInside: "avoid",
          pageBreakInside: "avoid",
          breakAfter: "avoid",
          pageBreakAfter: "avoid",
        }}
      >
        📌 กำหนดการเดินทางรายวัน (Detailed Daily Itinerary)
      </h2>

      {days.map((day) => {
        const meals = [
          day.breakfast_included ? "เช้า" : null,
          day.lunch_included ? "กลางวัน" : null,
          day.dinner_included ? "เย็น" : null,
        ].filter(Boolean).join(" / ") || "อิสระตามอัธยาศัย";

        const dateStr = day.actual_date
          ? (() => {
              const d = new Date(day.actual_date);
              if (d.getFullYear() > 2500) d.setFullYear(d.getFullYear() - 543);
              return d.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            })()
          : "";

        // Extract key POIs for highlight pill cleanly
        const highlightsPill = day.TourActivities
          .map(a => {
            const loc = (a.location_name || a.activity_title || "").trim();
            if (loc.length > 40) {
              const cleaned = loc.split(/[\s•—\-\|\:\.]+/).filter(Boolean);
              return cleaned.slice(0, 3).join(" ");
            }
            return loc;
          })
          .filter(Boolean)
          .slice(0, 4)
          .join(" • ");

        const selectedImages = day.TourDayImages ? day.TourDayImages.filter(img => img.is_selected) : [];

        return (
          <div key={day.id} className="day-section" style={{ marginBottom: "26px", breakInside: "auto", pageBreakInside: "auto" }}>
            {/* Header Group: Day Pill + Date + Highlights + Hero Image (Kept together, never orphaned) */}
            <div className="day-header-group page-break-avoid" style={{ breakInside: "avoid", pageBreakInside: "avoid", breakAfter: "avoid", pageBreakAfter: "avoid", marginBottom: "10px" }}>
              {/* Header Red Banner Pill */}
              <div style={{ marginBottom: "6px" }}>
                <div style={{
                  display: "inline-block",
                  backgroundColor: PR_RED,
                  color: "white",
                  borderRadius: "16px",
                  padding: "5px 14px",
                  fontWeight: 800,
                  fontSize: "13px",
                  boxShadow: "0 2px 4px rgba(211,47,47,0.2)",
                }}>
                  DAY {day.day_number} : {day.day_title || `ท่องเที่ยวเมือง ${day.city || ""}`}
                </div>
                {dateStr && <div style={{ fontSize: "11px", color: "#777", marginTop: "3px", paddingLeft: "8px" }}>{dateStr}</div>}
              </div>

              {/* Highlights Red Secondary Pill */}
              {highlightsPill && (
                <div style={{
                  backgroundColor: "#FFF3E0",
                  border: "1px solid #FFE082",
                  borderRadius: "12px",
                  padding: "5px 12px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#D84315",
                  marginBottom: "10px",
                  display: "inline-block",
                  width: "100%",
                }}>
                  🎯 สถานที่ไฮไลท์: {highlightsPill}
                </div>
              )}

              {/* Main Daily Images Hero — Controlled height 42mm */}
              {selectedImages.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "100%",
                      height: "42mm",
                      backgroundImage: `url(${selectedImages[0].image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Activities Timeline & Storytelling Narrative */}
            <div className="timeline" style={{ paddingLeft: "14px", borderLeft: `3px solid #E0E0E0`, marginLeft: "8px", marginBottom: "10px", breakInside: "auto", pageBreakInside: "auto" }}>
              {day.TourActivities.map(activity => {
                const titleStr = (activity.activity_title || "").trim();
                const descStr = (activity.activity_description || "").trim();
                const cleanDesc = descStr.replace(/^นำท่าน\s*\*\*/, '').replace(/\*\*/g, '').replace(/^นำท่าน\s*/, '').trim();
                const isDuplicateDesc = descStr && titleStr && (descStr === titleStr || cleanDesc === titleStr);

                return (
                  <div key={activity.id} className="timeline-item page-break-avoid" style={{ marginBottom: "10px", position: "relative", breakInside: "avoid", pageBreakInside: "avoid" }}>
                    <div style={{ position: "absolute", left: "-20px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", backgroundColor: PR_RED, border: "2px solid white" }} />
                    
                    <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                      {activity.time_text && (
                        <span style={{ color: PR_RED, fontWeight: 800, fontSize: "11.5px", minWidth: "55px", flexShrink: 0 }}>
                          {activity.time_text}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, fontSize: "12.5px", color: PR_BLUE }}>
                        {activity.activity_title}
                      </span>
                    </div>

                    {activity.activity_description && !isDuplicateDesc && (
                      <div style={{ color: "#444", fontSize: "11.5px", lineHeight: "1.6", marginTop: "2px", paddingLeft: activity.time_text ? "61px" : "0" }}>
                        {renderRichText(activity.activity_description)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Meals & Hotel Info Footer Box (Compact summary block, kept attached to day) */}
            <div className="meals-hotel-box summary-block page-break-avoid" style={{
              backgroundColor: "#F8F9FA",
              borderLeft: `4px solid ${PR_BLUE}`,
              borderRadius: "0 6px 6px 0",
              padding: "8px 12px",
              fontSize: "11.5px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              boxSizing: "border-box",
              breakInside: "avoid",
              pageBreakInside: "avoid",
              breakBefore: "avoid",
              pageBreakBefore: "avoid",
            }}>
              <div>
                <strong style={{ color: PR_RED }}>🍽️ อาหาร:</strong> {meals}
              </div>
              <div>
                <strong style={{ color: PR_BLUE }}>🏨 ที่พัก:</strong>{" "}
                {day.hotel_name || "โรงแรมระดับมาตรฐาน"}{" "}
                {hotelLevel && !day.hotel_name?.includes("หรือเทียบเท่า") && !day.hotel_name?.includes(hotelLevel)
                  ? `(หรือเทียบเท่า ${hotelLevel})`
                  : ""}
              </div>
            </div>

            {/* Additional Sub-images grid if more than 1 image */}
            {selectedImages.length > 1 && (
              <div className="page-break-avoid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "10px", breakInside: "avoid", pageBreakInside: "avoid" }}>
                {selectedImages.slice(1, 3).map(img => (
                  <div
                    key={img.id}
                    style={{
                      height: "36mm",
                      backgroundImage: `url(${img.image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "8px",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
