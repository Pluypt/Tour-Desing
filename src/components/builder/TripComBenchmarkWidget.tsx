"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/pricing";

type TripComPackageBenchmark = {
  id: string;
  title: string;
  durationDays: number;
  durationNights: number;
  hotelLevel: string;
  estimatedPricePerPerson: number;
  tripType: string;
  highlights: string[];
  tripComUrl: string;
  priceDiffPercentage: number;
  competitiveStatus: "Cheaper" | "Competitive" | "Premium";
};

type TripComBenchmarkData = {
  destinationName: string;
  city: string;
  country: string;
  targetDurationDays: number;
  targetHotelLevel: string;
  currentPlanPricePerPerson: number;
  marketPriceRange: {
    minPrice: number;
    avgPrice: number;
    maxPrice: number;
  };
  tripComSearchUrl: string;
  packages: TripComPackageBenchmark[];
  marketAnalysisSummary: string;
};

export default function TripComBenchmarkWidget({
  city,
  country,
  duration,
  hotelLevel,
  currentSellingPrice,
  travelerCount
}: {
  city: string;
  country: string;
  duration: number;
  hotelLevel?: string;
  currentSellingPrice?: number;
  travelerCount?: number;
}) {
  const [data, setData] = useState<TripComBenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBenchmark() {
      setLoading(true);
      try {
        const res = await fetch("/api/market-benchmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city,
            country,
            duration,
            hotelLevel,
            currentSellingPrice,
            travelerCount
          })
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Failed to load benchmark data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBenchmark();
  }, [city, country, duration, hotelLevel, currentSellingPrice, travelerCount]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#F5F7FA", borderRadius: "12px" }}>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>⏳ กำลังค้นหาข้อมูลทัวร์ใกล้เคียงและเปรียบเทียบราคาจาก Trip.com...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "14px",
      border: "1px solid #E0E7FF",
      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
      padding: "20px",
      marginTop: "25px",
      marginBottom: "25px"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        borderBottom: "1px solid #EEF2FF",
        paddingBottom: "15px",
        marginBottom: "15px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            backgroundColor: "#2563EB",
            color: "#FFF",
            fontSize: "0.75rem",
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: "20px",
            letterSpacing: "0.5px"
          }}>
            TRIP.COM MARKET BENCHMARK
          </div>
          <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700, color: "#1E293B" }}>
            📊 เปรียบเทียบราคาแพลนใกล้เคียงจาก Trip.com ({data.destinationName})
          </h3>
        </div>

        <a
          href={data.tripComSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#2563EB",
            backgroundColor: "#EFF6FF",
            padding: "6px 14px",
            borderRadius: "8px",
            textDecoration: "none",
            border: "1px solid #BFDBFE"
          }}
        >
          🔍 ค้นหาทัวร์จริงบน Trip.com ↗
        </a>
      </div>

      {/* Summary Alert */}
      <div style={{
        backgroundColor: "#F0F9FF",
        borderLeft: "4px solid #0284C7",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        fontSize: "0.9rem",
        color: "#0369A1"
      }}>
        💡 <strong>วิเคราะห์การแข่งขัน:</strong> {data.marketAnalysisSummary}
      </div>

      {/* Overview Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "14px",
        marginBottom: "20px"
      }}>
        <div style={{ padding: "14px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "4px" }}>ราคาเสนอขายของคุณ</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563EB" }}>
            {formatCurrency(data.currentPlanPricePerPerson)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "2px" }}>ต่อท่าน ({data.targetDurationDays} วัน {data.targetDurationDays - 1} คืน)</div>
        </div>

        <div style={{ padding: "14px", backgroundColor: "#F0FDF4", borderRadius: "10px", border: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "4px" }}>ราคาเริ่มต้นตลาด (Trip.com)</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#15803D" }}>
            {formatCurrency(data.marketPriceRange.minPrice)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "2px" }}>สำหรับแพ็กเกจระยะสั้น/จอยทัวร์</div>
        </div>

        <div style={{ padding: "14px", backgroundColor: "#FEFCE8", borderRadius: "10px", border: "1px solid #FEF08A" }}>
          <div style={{ fontSize: "0.8rem", color: "#854D0E", marginBottom: "4px" }}>ราคาเฉลี่ยตลาดทัวร์ตรงกัน</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#CA8A04" }}>
            {formatCurrency(data.marketPriceRange.avgPrice)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#854D0E", marginTop: "2px" }}>ตรงตามจำนวน {data.targetDurationDays} วัน</div>
        </div>

        <div style={{ padding: "14px", backgroundColor: "#FAF5FF", borderRadius: "10px", border: "1px solid #E9D5FF" }}>
          <div style={{ fontSize: "0.8rem", color: "#6B21A8", marginBottom: "4px" }}>ราคาทัวร์พรีเมียม / VIP</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#7E22CE" }}>
            {formatCurrency(data.marketPriceRange.maxPrice)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B21A8", marginTop: "2px" }}>สำหรับแพ็กเกจระยะยาวขึ้น</div>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#F1F5F9", borderBottom: "2px solid #E2E8F0" }}>
              <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>แพ็กเกจทัวร์เปรียบเทียบจาก Trip.com</th>
              <th style={{ padding: "10px", textAlign: "center", color: "#475569" }}>จำนวนวัน</th>
              <th style={{ padding: "10px", textAlign: "center", color: "#475569" }}>รูปแบบทริป</th>
              <th style={{ padding: "10px", textAlign: "right", color: "#475569" }}>ราคาเฉลี่ย/ท่าน</th>
              <th style={{ padding: "10px", textAlign: "center", color: "#475569" }}>เปรียบเทียบกับราคาคุณ</th>
              <th style={{ padding: "10px", textAlign: "center", color: "#475569" }}>ลิงก์ Trip.com</th>
            </tr>
          </thead>
          <tbody>
            {data.packages.map((pkg) => {
              const isTarget = pkg.durationDays === data.targetDurationDays;
              return (
                <tr
                  key={pkg.id}
                  style={{
                    borderBottom: "1px solid #E2E8F0",
                    backgroundColor: isTarget ? "#EFF6FF" : "transparent"
                  }}
                >
                  <td style={{ padding: "12px 10px" }}>
                    <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "4px" }}>
                      {pkg.title} {isTarget && <span style={{ color: "#2563EB", fontSize: "0.75rem" }}>(ตรงแพลนนี้)</span>}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {pkg.highlights.map((h, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "0.72rem",
                            backgroundColor: isTarget ? "#DBEAFE" : "#F1F5F9",
                            color: "#334155",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}
                        >
                          • {h}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}>
                    {pkg.durationDays} วัน {pkg.durationNights} คืน
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "center", color: "#64748B" }}>
                    {pkg.tripType}
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                    {formatCurrency(pkg.estimatedPricePerPerson)}
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "center" }}>
                    {pkg.priceDiffPercentage === 0 ? (
                      <span style={{ backgroundColor: "#E2E8F0", color: "#475569", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                        เท่ากัน
                      </span>
                    ) : pkg.priceDiffPercentage > 0 ? (
                      <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                        สูงกว่าตลาด +{pkg.priceDiffPercentage}%
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                        ถูกกว่าตลาด {pkg.priceDiffPercentage}%
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "center" }}>
                    <a
                      href={pkg.tripComUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563EB", fontWeight: 600, textDecoration: "underline", fontSize: "0.8rem" }}
                    >
                      ดูทัวร์ Trip.com ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
