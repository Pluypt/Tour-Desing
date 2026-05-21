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

      {/* Hero / Cover Image */}
      <div style={{
        width: "100%", height: "240px", borderRadius: "10px", overflow: "hidden",
        marginBottom: "24px", position: "relative", backgroundColor: "#ddd",
        backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        {heroImageUrl && hasCustomCover && (
          <>
            <div style={{ position: "absolute", inset: 0, background: overlay }} />
            <div style={{ position: "absolute", inset: 0, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end", color: textOnImage }}>
              {badgeText && (
                <div style={{ backgroundColor: accentColor, color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, width: "fit-content", marginBottom: "8px" }}>
                  {badgeText}
                </div>
              )}
              {title && <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{title}</div>}
              {subheadline && <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>{subheadline}</div>}
              <div style={{ display: "flex", gap: "14px", fontSize: "11px", opacity: 0.85 }}>
                {travelDateText && <span>📅 {travelDateText}</span>}
                {priceText && <span style={{ color: "#FFD700", fontWeight: 700 }}>฿ {priceText}</span>}
              </div>
            </div>
            <div style={{ position: "absolute", top: "12px", left: "16px", color: textOnImage, fontSize: "10px", fontWeight: 700, opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              PR TRAVEL GROUP
            </div>
          </>
        )}
        {!heroImageUrl && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#bbb", fontSize: "13px" }}>
            ไม่มีรูปหน้าปก
          </div>
        )}
      </div>

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
