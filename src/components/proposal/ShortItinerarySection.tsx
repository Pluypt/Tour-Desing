import React from "react";

const PR_RED = "#D32F2F";
const PR_BLUE = "#0D47A1";
const PR_ORANGE = "#F57C00";

type Activity = {
  activity_title: string | null;
  location_name?: string | null;
};

type TourDay = {
  day_number: number;
  day_title: string | null;
  city: string | null;
  hotel_name: string | null;
  breakfast_included: boolean;
  lunch_included: boolean;
  dinner_included: boolean;
  TourActivities: Activity[];
};

type ShortItineraryProps = {
  days: TourDay[];
  title?: string | null;
  duration?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  airline?: string | null;
  flightRoute?: string | null;
  outboundFlight?: string | null;
  returnFlight?: string | null;
  hotelLevel?: string | null;
};

export default function ShortItinerarySection({
  days,
  title,
  duration,
  startDate,
  endDate,
  airline,
  flightRoute,
  outboundFlight,
  returnFlight,
  hotelLevel,
}: ShortItineraryProps) {
  const nights = duration ? Math.max(0, duration - 1) : 0;

  const formatDateRange = () => {
    if (!startDate) return "";
    const start = new Date(startDate);
    if (start.getFullYear() > 2500) start.setFullYear(start.getFullYear() - 543);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    if (!endDate) return start.toLocaleDateString("th-TH", options);
    const end = new Date(endDate);
    if (end.getFullYear() > 2500) end.setFullYear(end.getFullYear() - 543);
    return `วันที่ ${start.toLocaleDateString("th-TH", { day: "numeric" })} - ${end.toLocaleDateString("th-TH", options)}`;
  };

  return (
    <div style={{ marginBottom: "36px", pageBreakInside: "avoid" }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${PR_BLUE} 0%, #1565C0 100%)`,
          color: "white",
          borderRadius: "12px 12px 0 0",
          padding: "16px 20px",
          textAlign: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "1px", color: "#FFD54F" }}>
          {title || "โปรแกรมท่องเที่ยว"}
        </div>
        <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "4px" }}>
          {duration ? `${duration} วัน ${nights} คืน` : ""} {formatDateRange() ? `| ${formatDateRange()}` : ""}
        </div>
      </div>

      {/* 2. Flight & Luggage Info Bar */}
      <div
        style={{
          backgroundColor: "#FFF8E1",
          border: "1px solid #FFE082",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#5D4037",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
          <span>✈️ สายการบิน:</span>
          <span style={{ color: PR_BLUE, fontWeight: 700 }}>{airline || "Thai Airways / สายการบินชั้นนำ"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>🧳 น้ำหนักกระเป๋า 20 Kg</span>
          {flightRoute && <span>📍 เส้นทาง: {flightRoute}</span>}
        </div>
      </div>

      {/* Flight Detail Boxes */}
      {(outboundFlight || returnFlight) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", backgroundColor: "#FFF3E0", padding: "8px 12px", borderLeft: "1px solid #FFE082", borderRight: "1px solid #FFE082", fontSize: "11px" }}>
          <div style={{ backgroundColor: "#E65100", color: "white", borderRadius: "6px", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
            <span>🛫 ขาไป ({outboundFlight || "BKK - HKG"})</span>
          </div>
          <div style={{ backgroundColor: "#E65100", color: "white", borderRadius: "6px", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
            <span>🛬 ขากลับ ({returnFlight || "HKG - BKK"})</span>
          </div>
        </div>
      )}

      {/* 3. Summary Overview Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          backgroundColor: "white",
          border: "1px solid #BBDEFB",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: PR_BLUE, color: "white", textTransform: "uppercase" }}>
            <th style={{ padding: "10px 8px", width: "45px", textAlign: "center", borderRight: "1px solid #1976D2" }}>วัน</th>
            <th style={{ padding: "10px 12px", textAlign: "left", borderRight: "1px solid #1976D2" }}>โปรแกรมท่องเที่ยว</th>
            <th style={{ padding: "10px 4px", width: "120px", textAlign: "center", borderRight: "1px solid #1976D2" }}>
              <div>อาหาร</div>
              <div style={{ fontSize: "10px", fontWeight: 400, marginTop: "2px", opacity: 0.9 }}>B | L | D</div>
            </th>
            <th style={{ padding: "10px 12px", width: "180px", textAlign: "left" }}>โรงแรมที่พัก</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, idx) => {
            const isEven = idx % 2 === 0;
            const rowBg = isEven ? "#FFFFFF" : "#F4F8FB";

            // Extract POI names from activities
            const poiList = day.TourActivities
              .map(a => a.location_name || a.activity_title)
              .filter(Boolean)
              .join(" – ");

            const programText = day.day_title || poiList || `ท่องเที่ยวเมือง ${day.city || ""}`;

            return (
              <tr key={day.day_number} style={{ backgroundColor: rowBg, borderBottom: "1px solid #E3F2FD" }}>
                {/* Day No */}
                <td style={{ padding: "12px 6px", textAlign: "center", fontWeight: 800, color: PR_BLUE, borderRight: "1px solid #E3F2FD" }}>
                  {day.day_number}
                </td>

                {/* Program Description */}
                <td style={{ padding: "10px 12px", color: "#222", lineHeight: "1.5", borderRight: "1px solid #E3F2FD" }}>
                  <div style={{ fontWeight: 600 }}>{programText}</div>
                </td>

                {/* Meals Icons (B | L | D) */}
                <td style={{ padding: "8px 4px", textAlign: "center", borderRight: "1px solid #E3F2FD" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", fontSize: "13px" }}>
                    <span title="อาหารเช้า" style={{ color: day.breakfast_included ? PR_RED : "#ccc" }}>
                      {day.breakfast_included ? "🍽️" : "-"}
                    </span>
                    <span style={{ color: "#aaa" }}>|</span>
                    <span title="อาหารกลางวัน" style={{ color: day.lunch_included ? PR_RED : "#ccc" }}>
                      {day.lunch_included ? "🍽️" : "-"}
                    </span>
                    <span style={{ color: "#aaa" }}>|</span>
                    <span title="อาหารเย็น" style={{ color: day.dinner_included ? PR_RED : "#ccc" }}>
                      {day.dinner_included ? "🍽️" : "-"}
                    </span>
                  </div>
                </td>

                {/* Hotel */}
                <td style={{ padding: "10px 12px", fontSize: "11px", color: "#333", lineHeight: "1.4" }}>
                  {day.hotel_name ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "#1565C0" }}>{day.hotel_name}</div>
                      {hotelLevel && !day.hotel_name?.includes("หรือเทียบเท่า") && !day.hotel_name?.includes(hotelLevel) && (
                        <div style={{ color: "#777", fontSize: "10px" }}>หรือเทียบเท่า ({hotelLevel})</div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#999" }}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
