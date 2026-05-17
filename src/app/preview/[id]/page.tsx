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
          TourDayImages: { where: { is_selected: true }, orderBy: { sort_order: "asc" } },
        },
      },
      Inclusions: { orderBy: { sort_order: "asc" } },
      Exclusions: { orderBy: { sort_order: "asc" } },
      CoverDesigns: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });

  if (!plan) return notFound();

  const cover = plan.CoverDesigns[0] ?? null;
  // Use cover background if available, otherwise fall back to hero_image_url
  const heroImageUrl = cover?.background_url || plan.hero_image_url;

  // SECURITY: never expose internal cost fields to this page
  // Only selling_price_per_person, total_selling_price, deposit_amount are shown

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
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
          minHeight: "297mm",
          backgroundColor: "white",
          boxShadow: "0 0 20px rgba(0,0,0,0.1)",
          padding: "18mm 20mm",
          color: "#333",
          fontFamily: "'Inter', 'Sarabun', sans-serif",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        {/* 1. Cover Page */}
        <ProposalCover
          title={cover?.headline || plan.title}
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
          subheadline={cover?.subheadline}
          badgeText={cover?.badge_text}
          highlightText={cover?.highlight_text}
          priceText={cover?.price_text}
          travelDateText={cover?.travel_date_text}
          themeColor={cover?.theme_color}
          overlayStyle={cover?.overlay_style}
        />

        {/* 2. Package & Price (customer-facing only — no internal cost) */}
        <PackagePriceSection
          sellingPricePerPerson={plan.selling_price_per_person}
          totalSellingPrice={plan.total_selling_price}
          travelerCount={plan.traveler_count}
          depositAmount={plan.deposit_amount}
        />

        {/* 3. Short Itinerary */}
        <ShortItinerarySection days={plan.TourDays} />

        {/* 4. Inclusions & Exclusions */}
        <InclusionExclusionSection
          inclusions={plan.Inclusions}
          exclusions={plan.Exclusions}
          notes={plan.customer_note}
        />

        {/* 5. Daily Itinerary */}
        <DailyItinerarySection days={plan.TourDays} />

        {/* Footer */}
        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #eee", textAlign: "center", fontSize: "11px", color: "#aaa" }}>
          PR Global Travel Group Co., Ltd. | เอกสารนี้จัดทำโดยทีมงาน PR Travel สำหรับลูกค้าเท่านั้น
        </div>
      </div>
    </div>
  );
}
