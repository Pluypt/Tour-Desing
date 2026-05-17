const PR_RED = "#D32F2F";

type PackagePriceSectionProps = {
  sellingPricePerPerson: number | null;
  totalSellingPrice: number | null;
  travelerCount: number | null;
  depositAmount: number | null;
};

export default function PackagePriceSection({
  sellingPricePerPerson,
  totalSellingPrice,
  travelerCount,
  depositAmount,
}: PackagePriceSectionProps) {
  if (!sellingPricePerPerson && !totalSellingPrice) return null;

  const fmt = (n: number | null) =>
    n != null ? n.toLocaleString("th-TH") + " บาท" : "-";

  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ color: PR_RED, fontSize: "16px", fontWeight: 700, borderBottom: `2px solid ${PR_RED}`, paddingBottom: "8px", marginBottom: "16px" }}>
        แพ็กเกจและราคา
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        {sellingPricePerPerson != null && (
          <div style={{ border: `2px solid ${PR_RED}`, borderRadius: "8px", padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>ราคาต่อท่าน</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: PR_RED }}>{sellingPricePerPerson.toLocaleString("th-TH")}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>บาท / ท่าน</div>
          </div>
        )}
        {totalSellingPrice != null && (
          <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>ราคารวม {travelerCount} ท่าน</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#333" }}>{totalSellingPrice.toLocaleString("th-TH")}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>บาท</div>
          </div>
        )}
        {depositAmount != null && depositAmount > 0 && (
          <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>มัดจำ 30%</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#555" }}>{fmt(depositAmount)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
