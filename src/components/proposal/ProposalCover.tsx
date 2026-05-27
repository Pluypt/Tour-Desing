const PR_RED = "#D32F2F";

type ProposalCoverProps = {
  title: string | null;
  tourCode: string | null;
  startDate: Date | null;
  endDate: Date | null;
  duration: number | null;
  travelerCount: number | null;
  tripType: string | null;
  airline: string | null;
  flightRoute: string | null;
  customerName: string | null | undefined;
  heroImageUrl: string | null;
  // Cover design overrides
  subheadline?: string | null;
  badgeText?: string | null;
  highlightText?: string | null;
  priceText?: string | null;
  travelDateText?: string | null;
  themeColor?: string | null;
  overlayStyle?: string | null;
};

function getOverlay(style: string | null | undefined, color: string): string {
  switch (style) {
    case "dark": return "linear-gradient(to right, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.25) 100%)";
    case "light": return "linear-gradient(to right, rgba(255,255,255,0.88) 40%, rgba(255,255,255,0.25) 100%)";
    case "gradient": return `linear-gradient(to right, ${color}cc 30%, transparent 100%)`;
    default: return "none";
  }
}

export default function ProposalCover({
  title, tourCode, startDate, endDate, duration,
  travelerCount, tripType, airline, flightRoute,
  customerName, heroImageUrl,
  subheadline, badgeText, highlightText, priceText, travelDateText,
  themeColor, overlayStyle,
}: ProposalCoverProps) {
  const nights = duration ? duration - 1 : 0;
  const accentColor = themeColor || PR_RED;
  const hasCustomCover = !!(heroImageUrl && overlayStyle);
  const overlay = getOverlay(overlayStyle, accentColor);
  const textOnImage = overlayStyle === "light" ? "#222" : "#fff";

  const dateRange = startDate && endDate
    ? `${startDate.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} – ${endDate.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`
    : "-";

  return (
    <div style={{ marginBottom: "40px", pageBreakAfter: "always" }}>      {/* Company Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "3px", marginBottom: "4px" }}>PR GLOBAL TRAVEL GROUP CO., LTD.</div>
        <h1 style={{ color: accentColor, fontSize: "26px", fontWeight: 800, margin: "0 0 4px" }}>FINAL ITINERARY</h1>
        <div style={{ width: "50px", height: "3px", backgroundColor: accentColor, margin: "0 auto 12px" }} />
        <p style={{ color: "#999", fontSize: "11px", margin: 0 }}>บริการแพ็กเกจทัวร์ต่างประเทศครบวงจร</p>
      </div>

      {/* Hero / Cover Image — use background-image for most reliable cover cropping in PDF engine */}
      {heroImageUrl ? (
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "60%",
              height: "140mm",         /* ความกว้าง 60% ของ A4 คือ ~105mm ดังนั้นความสูง 3:4 คือ ~140mm */
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: "cover", /* ตัดส่วนที่เกินออก ไม่บีบสัดส่วนรูป */
              backgroundPosition: "center",
              display: "inline-block",
              borderRadius: "10px",
            }}
          />
        </div>
      ) : (
        <div style={{
          width: "60%", margin: "0 auto 24px",
          borderRadius: "10px", backgroundColor: "#ddd",
          height: "200px", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "#bbb", fontSize: "13px",
        }}>
          ไม่มีรูปหน้าปก
        </div>
      )}

      {/* Tour Title */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#222", margin: "0 0 4px" }}>{title || "ชื่อโปรแกรมทัวร์"}</h2>
        {subheadline && !hasCustomCover && <p style={{ color: "#666", fontSize: "13px", margin: "0 0 4px" }}>{subheadline}</p>}
        <div style={{ fontSize: "12px", color: "#aaa" }}>รหัสทัวร์: {tourCode || "-"}</div>
      </div>

      {/* Info Box */}
      <div style={{ display: "inline-block", width: "100%", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
          {[
            ["ระยะเวลา", `${duration} วัน ${nights} คืน`],
            ["วันที่เดินทาง", travelDateText || dateRange],
            ["จำนวนผู้เดินทาง", `${travelerCount || "-"} ท่าน`],
            ["ประเภททริป", tripType || "-"],
            ["สายการบิน", airline || "-"],
            ["เส้นทางบิน", flightRoute || "-"],
            ["จัดทำสำหรับ", customerName || "-"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
              <span style={{ color: "#999", minWidth: "110px", flexShrink: 0 }}>{label}:</span>
              <span style={{ color: "#333", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
