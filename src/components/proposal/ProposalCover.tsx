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

  const formatThaiDate = (date: Date) => {
    const d = new Date(date);
    if (d.getFullYear() > 2500) d.setFullYear(d.getFullYear() - 543);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  };

  const dateRange = startDate && endDate
    ? `${formatThaiDate(startDate)} – ${formatThaiDate(endDate)}`
    : "-";

  return (
    <div className="cover-page" style={{ marginBottom: "20px", breakAfter: "page", pageBreakAfter: "always", breakInside: "avoid", pageBreakInside: "avoid" }}>
      {/* Company Header */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "3px", marginBottom: "3px" }}>PR GLOBAL TRAVEL GROUP CO., LTD.</div>
        <h1 style={{ color: accentColor, fontSize: "24px", fontWeight: 800, margin: "0 0 4px" }}>FINAL ITINERARY</h1>
        <div style={{ width: "45px", height: "3px", backgroundColor: accentColor, margin: "0 auto 8px" }} />
        <p style={{ color: "#999", fontSize: "11px", margin: 0 }}>บริการแพ็กเกจทัวร์ต่างประเทศครบวงจร</p>
      </div>

      {/* Hero / Cover Image — controlled 90mm height so cover fits on 1 page */}
      {heroImageUrl ? (
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <div
            style={{
              width: "65%",
              height: "90mm",
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "inline-block",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <div style={{
            width: "65%", margin: "0 auto",
            borderRadius: "10px", backgroundColor: "#eee",
            height: "90mm",
            display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            color: "#aaa", fontSize: "13px",
          }}>
            ไม่มีรูปหน้าปก
          </div>
        </div>
      )}

      {/* Tour Title */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#222", margin: "0 0 4px" }}>{title || "ชื่อโปรแกรมทัวร์"}</h2>
        {subheadline && !hasCustomCover && <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px" }}>{subheadline}</p>}
        <div style={{ fontSize: "11px", color: "#888" }}>รหัสทัวร์: {tourCode || "-"}</div>
      </div>

      {/* Info Box */}
      <div style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px 18px", backgroundColor: "#fafafa" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
          {[
            ["ระยะเวลา", `${duration} วัน ${nights} คืน`],
            ["วันที่เดินทาง", travelDateText || dateRange],
            ["จำนวนผู้เดินทาง", `${travelerCount || "-"} ท่าน`],
            ["ประเภททริป", tripType || "-"],
            ["สายการบิน", airline || "-"],
            ["เส้นทางบิน", flightRoute || "-"],
            ["จัดทำสำหรับ", customerName || "-"],
          ].map(([label, value]) => (
            <div key={label} className={label === "วันที่เดินทาง" ? "date-display-row" : ""} style={{ display: "flex", gap: "6px", fontSize: "11.5px" }}>
              <span style={{ color: "#888", minWidth: "100px", flexShrink: 0 }}>{label}:</span>
              <span style={{ color: "#222", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
