const PR_RED = "#D32F2F";

type TourDay = {
  day_number: number;
  day_title: string | null;
  city: string | null;
  TourActivities: { activity_title: string | null }[];
};

export default function ShortItinerarySection({ days }: { days: TourDay[] }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ color: PR_RED, fontSize: "16px", fontWeight: 700, borderBottom: `2px solid ${PR_RED}`, paddingBottom: "8px", marginBottom: "16px" }}>
        แผนทัวร์แบบย่อ
      </h2>      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {days.map(day => {
          const highlights = day.TourActivities
            .slice(0, 3)
            .map(a => a.activity_title)
            .filter(Boolean)
            .join(" • ");
          return (
            <div key={day.day_number} style={{ display: "flex", gap: "12px", fontSize: "13px", alignItems: "flex-start" }}>
              <div style={{
                backgroundColor: PR_RED, color: "white", padding: "2px 10px",
                borderRadius: "4px", fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                DAY {day.day_number}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#333" }}>{day.day_title || `วันที่ ${day.day_number}`}</span>
                {highlights && <span style={{ color: "#666", marginLeft: "8px" }}>— {highlights}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
