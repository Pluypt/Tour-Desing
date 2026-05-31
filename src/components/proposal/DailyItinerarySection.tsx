const PR_RED = "#D32F2F";

type Activity = {
  id: string;
  time_text: string | null;
  activity_title: string | null;
  activity_description: string | null;
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

export default function DailyItinerarySection({ days, hotelLevel }: { days: TourDay[]; hotelLevel?: string | null }) {
  return (
    <div style={{ pageBreakBefore: "always" }}>
      <style>{`
        @media print {
          .day-container {
            margin-bottom: -10px !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
      <h2 style={{ color: PR_RED, fontSize: "16px", fontWeight: 700, borderBottom: `2px solid ${PR_RED}`, paddingBottom: "8px", marginBottom: "24px" }}>
        รายละเอียดโปรแกรมรายวัน
      </h2>

      {days.map(day => {
        const meals = [
          day.breakfast_included && "อาหารเช้า",
          day.lunch_included && "อาหารเที่ยง",
          day.dinner_included && "อาหารค่ำ",
        ].filter(Boolean).join(" | ") || "ไม่รวมอาหาร";

        const dateStr = day.actual_date
          ? (() => {
              const d = new Date(day.actual_date);
              if (d.getFullYear() > 2500) d.setFullYear(d.getFullYear() - 543);
              return d.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            })()
          : "";

        return (
          <div key={day.id}>
            <div
              className="day-container"
              style={{
                marginBottom: "0px", /* บังคับเป็น 0 เสมอเพื่อตัดปัญหาตอนพิมพ์ */
                paddingBottom: "36px", /* ใช้ padding แทน margin สำหรับแสดงผลบนจอ */
              }}
            >
            {/* Wrapper สำหรับ Day Header เพื่อป้องกันปัญหาขอบสีแดง (borderLeft) ล้นทะลุหน้ากระดาษ (WebKit bleed bug) */}
            <div style={{ 
              pageBreakBefore: day.day_number > 1 ? "always" : "auto", 
              breakBefore: day.day_number > 1 ? "page" : "auto",
              paddingTop: day.day_number > 1 ? "24px" : "0" /* ดันหัวกระดาษลงมาให้มีระยะขอบที่สวยงาม และแก้บั๊กโดนตัดขอบบนจาก margin ติดลบ */
            }}>
              {/* Day Header */}
              <div style={{ 
                display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", backgroundColor: "#fafafa", padding: "10px 14px", borderRadius: "6px", borderLeft: `4px solid ${PR_RED}` 
              }}>
                <div style={{ backgroundColor: PR_RED, color: "white", padding: "4px 14px", borderRadius: "4px", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>
                  DAY {day.day_number}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#222" }}>{day.day_title || `วันที่ ${day.day_number}`}</div>
                  {dateStr && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{dateStr}</div>}
                </div>
              </div>
            </div>

            {/* Activities Timeline */}
            <div style={{ paddingLeft: "18px", borderLeft: "2px solid #f0f0f0", marginLeft: "14px", marginBottom: "14px" }}>
              {day.TourActivities.map(activity => (
                <div key={activity.id} style={{ marginBottom: "16px", position: "relative", pageBreakInside: "avoid" }}>
                  <div style={{ position: "absolute", left: "-24px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: PR_RED, border: "2px solid white", boxShadow: "0 0 0 1px #D32F2F" }} />
                  <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                    {activity.time_text && (
                      <span style={{ color: PR_RED, fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap" }}>{activity.time_text}</span>
                    )}
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#222" }}>{activity.activity_title}</span>
                  </div>
                  {activity.activity_description && (
                    <p style={{ color: "#666", fontSize: "12px", lineHeight: "1.7", margin: "4px 0 0", paddingLeft: activity.time_text ? "52px" : "0" }}>
                      {activity.activity_description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Hotel & Meals */}
            <div style={{ backgroundColor: "#fff5f5", border: "1px solid #ffebeb", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", display: "flex", gap: "20px", flexWrap: "wrap", pageBreakInside: "avoid" }}>
              <span>
                <strong style={{ color: PR_RED }}>ที่พัก:</strong>{" "}
                {day.hotel_name || "ไม่ระบุ"}
                {day.hotel_name && hotelLevel && (
                  <span style={{ color: "#888" }}> (หรือเทียบเท่า {hotelLevel})</span>
                )}
              </span>
              <span><strong style={{ color: PR_RED }}>อาหาร:</strong> {meals}</span>
            </div>

            {/* Day Images Grid (Row-based layout to strictly enforce pageBreakInside: avoid in WebKit) */}
            {day.TourDayImages && day.TourDayImages.filter(img => img.is_selected).length > 0 && (
              <div style={{ marginTop: "14px" }}>
                {Array.from({ length: Math.ceil(day.TourDayImages.filter(img => img.is_selected).length / 2) }).map((_, rowIndex) => {
                  const rowImages = day.TourDayImages!.filter(img => img.is_selected).slice(rowIndex * 2, rowIndex * 2 + 2);
                  return (
                    <div key={rowIndex} style={{ 
                      display: "flex", 
                      gap: "10px", 
                      paddingTop: "14px", /* ใช้ padding-top แทน margin เพื่อบังคับรักษาระยะขอบไว้เมื่อขึ้นหน้าใหม่ */
                      pageBreakInside: "avoid", 
                      breakInside: "avoid" 
                    }}>
                      {rowImages.map(img => (
                        <div
                          key={img.id}
                          style={{
                            flex: 1,
                            height: "48mm", /* ล็อคความสูงตายตัวสำหรับ 16:9 บนตาราง 2 คอลัมน์ของ A4 */
                            backgroundImage: `url(${img.image_url})`,
                            backgroundSize: "cover", /* ตัดส่วนเกินออกแทนการบีบ */
                            backgroundPosition: "center",
                            backgroundColor: "#eee",
                            borderRadius: "8px"
                          }}
                        />
                      ))}
                      {/* ถ้าแถวมีรูปเดียว ให้เติม div เปล่าเพื่อรักษาขนาด 50% */}
                      {rowImages.length === 1 && <div style={{ flex: 1 }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        );
      })}
    </div>
  );
}
