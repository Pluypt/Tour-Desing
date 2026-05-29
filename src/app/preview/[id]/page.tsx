import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportButtons from "./ExportButtons";
import ProposalCover from "@/components/proposal/ProposalCover";
import ShortItinerarySection from "@/components/proposal/ShortItinerarySection";
import InclusionExclusionSection from "@/components/proposal/InclusionExclusionSection";
import DailyItinerarySection from "@/components/proposal/DailyItinerarySection";
import PackagePriceSection from "@/components/proposal/PackagePriceSection";

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      TourDays: {
        orderBy: { sort_order: "asc" },
        include: {
          TourActivities: { orderBy: { sort_order: "asc" } },
          TourDayImages: {
            where: { is_selected: true },
            orderBy: { sort_order: "asc" }
          },
        },
      },
      Inclusions: { orderBy: { sort_order: "asc" } },
      Exclusions: { orderBy: { sort_order: "asc" } },
    },
  });

  if (!plan) return notFound();

  const heroImageUrl = plan.hero_image_url;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          #proposal-document { box-shadow: none !important; width: 100% !important; margin: 0 !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div style={{ width: "100%", maxWidth: "820px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>พรีวิวเอกสาร</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/builder/${plan.id}`} className="btn-secondary">แก้ไขแพลน</Link>
          <ExportButtons title={plan.title || "Final_Itinerary"} />
        </div>
      </div>

      {/* A4 Document */}
      <div
        id="proposal-document"
        style={{
          width: "210mm",
          backgroundColor: "white",
          boxShadow: "0 0 20px rgba(0,0,0,0.1)",
          padding: "20mm 18mm",
          color: "#333",
          fontFamily: "'Inter', 'Sarabun', sans-serif",
          fontSize: "13px",
          lineHeight: "1.6",
          marginBottom: "40px",
        }}
      >
        {/* 1. Cover Page */}
        <ProposalCover
          title={plan.title}
          tourCode={plan.tour_code}
          startDate={plan.start_date}
          endDate={plan.end_date}
          duration={plan.duration}
          travelerCount={plan.traveler_count}
          tripType={plan.trip_type}
          airline={plan.airline}
          flightRoute={plan.flight_route}
          customerName={plan.customer?.name}
          heroImageUrl={heroImageUrl}
        />

        {/* 2. Package & Price */}
        <PackagePriceSection
          sellingPricePerPerson={plan.selling_price_per_person}
          totalSellingPrice={plan.total_selling_price}
          travelerCount={plan.traveler_count}
          depositAmount={null}
        />

        {/* 3. Short Itinerary */}
        <ShortItinerarySection days={plan.TourDays} />

        {/* 4. Inclusions & Exclusions */}
        <InclusionExclusionSection
          inclusions={plan.Inclusions}
          exclusions={plan.Exclusions}
        />

        {/* 5. Daily Itinerary */}
        <DailyItinerarySection days={plan.TourDays} hotelLevel={plan.hotel_level} />

        {/* Footer */}
        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #eee", textAlign: "center", fontSize: "11px", color: "#aaa" }}>
          PR Global Travel Group Co., Ltd. | เอกสารนี้จัดทำโดยทีมงาน PR Travel สำหรับลูกค้าเท่านั้น
        </div>
      </div>
    </div>
  );
}
