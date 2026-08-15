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
    <div style={{ pageBreakBefore: "always" }}>
      <h2 style={{ color: PR_BLUE, fontSize: "18px", fontWeight: 800, borderBottom: `3px solid ${PR_RED}`, paddingBottom: "8px", marginBottom: "28px" }}>
        📌 กำหนดการเดินทางรายวัน (Detailed Daily Itinerary)
      </h2>

      {days.map((day, index) => {
        const previousDay = index > 0 ? days[index - 1] : null;
        const isPrevDaySmall = previousDay 
          ? (previousDay.TourActivities.length <= 3 && (!previousDay.TourDayImages || previousDay.TourDayImages.filter(img => img.is_selected).length === 0))
          : false;
        
        const shouldBreakPage = day.day_number > 1 && !isPrevDaySmall;

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

        // Extract key POIs for highlight pill
        const highlightsPill = day.TourActivities
          .map(a => a.location_name || a.activity_title)
          .filter(Boolean)
          .slice(0, 5)
          .join(" - ");

        const selectedImages = day.TourDayImages ? day.TourDayImages.filter(img => img.is_selected) : [];

        return (
          <div key={day.id} style={{ pageBreakBefore: shouldBreakPage ? "always" : "auto", marginBottom: "32px" }}>
            {/* Header Red Banner Pill */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{
                display: "inline-block",
                backgroundColor: PR_RED,
                color: "white",
                borderRadius: "20px",
                padding: "6px 18px",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "0 2px 6px rgba(211,47,47,0.25)",
              }}>
                DAY {day.day_number} : {day.day_title || `ท่องเที่ยวเมือง ${day.city || ""}`}
              </div>
              {dateStr && <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", paddingLeft: "10px" }}>{dateStr}</div>}
            </div>

            {/* Highlights Red Secondary Pill */}
            {highlightsPill && (
              <div style={{
                backgroundColor: "#FFF3E0",
                border: "1px solid #FFE082",
                borderRadius: "16px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#D84315",
                marginBottom: "16px",
                display: "inline-block",
                width: "100%",
              }}>
                🎯 สถานที่ไฮไลท์: {highlightsPill}
              </div>
            )}

            {/* Main Daily Images Hero */}
            {selectedImages.length > 0 && (
              <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
                <div
                  style={{
                    width: "100%",
                    height: "65mm",
                    backgroundImage: `url(${selectedImages[0].image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "14px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            )}

            {/* Activities Timeline & Storytelling Narrative */}
            <div style={{ paddingLeft: "16px", borderLeft: `3px solid #E0E0E0`, marginLeft: "8px", marginBottom: "16px" }}>
              {day.TourActivities.map(activity => (
                <div key={activity.id} style={{ marginBottom: "14px", position: "relative", pageBreakInside: "avoid" }}>
                  <div style={{ position: "absolute", left: "-22px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", backgroundColor: PR_RED, border: "2px solid white" }} />
                  
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    {activity.time_text && (
                      <span style={{ color: PR_RED, fontWeight: 800, fontSize: "12px", minWidth: "55px", flexShrink: 0 }}>
                        {activity.time_text}
                      </span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: "13px", color: PR_BLUE }}>
                      {activity.activity_title}
                    </span>
                  </div>

                  {activity.activity_description && (
                    <div style={{ color: "#444", fontSize: "12px", lineHeight: "1.7", marginTop: "4px", paddingLeft: activity.time_text ? "63px" : "0" }}>
                      {renderRichText(activity.activity_description)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Meals & Hotel Info Footer Box */}
            <div style={{
              backgroundColor: "#F5F5F5",
              borderLeft: `4px solid ${PR_BLUE}`,
              borderRadius: "0 8px 8px 0",
              padding: "10px 14px",
              fontSize: "12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              pageBreakInside: "avoid",
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "12px", pageBreakInside: "avoid" }}>
                {selectedImages.slice(1, 3).map(img => (
                  <div
                    key={img.id}
                    style={{
                      height: "40mm",
                      backgroundImage: `url(${img.image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "10px",
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
