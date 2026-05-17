const PR_RED = "#D32F2F";

const DEFAULT_INCLUSIONS = [
  "ตั๋วเครื่องบินไป-กลับตามรายการ",
  "ที่พักตามระดับที่ระบุ",
  "รถรับส่งตามโปรแกรม",
  "อาหารตามที่ระบุในรายการ",
  "ค่าเข้าชมสถานที่ตามโปรแกรม",
  "ประกันการเดินทาง",
  "ทีมงานประสานงานตลอดทริป",
];

const DEFAULT_EXCLUSIONS = [
  "ค่าใช้จ่ายส่วนตัว",
  "ค่าทำพาสปอร์ต",
  "ค่าธรรมเนียมวีซ่า (ถ้ามี)",
  "ค่าอาหารหรือเครื่องดื่มนอกเหนือจากรายการ",
  "ค่าทิปไกด์ / คนขับรถ",
  "ค่าใช้จ่ายจากเหตุสุดวิสัย",
];

type Item = { item_text: string };

export default function InclusionExclusionSection({
  inclusions,
  exclusions,
  notes,
}: {
  inclusions: Item[];
  exclusions: Item[];
  notes?: string | null;
}) {
  const incList = inclusions.length > 0 ? inclusions.map(i => i.item_text) : DEFAULT_INCLUSIONS;
  const excList = exclusions.length > 0 ? exclusions.map(e => e.item_text) : DEFAULT_EXCLUSIONS;

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
        {/* Inclusions */}
        <div>
          <h3 style={{ color: PR_RED, fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>✓</span> สิ่งที่รวมในราคา
          </h3>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", lineHeight: "1.9", color: "#444" }}>
            {incList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        {/* Exclusions */}
        <div>
          <h3 style={{ color: "#555", fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>✗</span> สิ่งที่ไม่รวมในราคา
          </h3>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", lineHeight: "1.9", color: "#666" }}>
            {excList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div style={{ backgroundColor: "#fffde7", border: "1px solid #fff176", borderRadius: "6px", padding: "12px 16px", fontSize: "12px", color: "#555" }}>
          <strong style={{ color: "#f57f17" }}>หมายเหตุ:</strong> {notes}
        </div>
      )}
    </div>
  );
}
