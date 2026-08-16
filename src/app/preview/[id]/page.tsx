import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportButtons from "./ExportButtons";
import ProposalCover from "@/components/proposal/ProposalCover";
import ShortItinerarySection from "@/components/proposal/ShortItinerarySection";
import InclusionExclusionSection from "@/components/proposal/InclusionExclusionSection";
import DailyItinerarySection from "@/components/proposal/DailyItinerarySection";
import PackagePriceSection from "@/components/proposal/PackagePriceSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      CoverDesigns: {
        orderBy: { updated_at: "desc" },
        take: 1,
      },
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

  const coverDesign = plan.CoverDesigns?.[0];
  const heroImageUrl = plan.hero_image_url || coverDesign?.background_url || null;

  return (
    <div style={{ minHeight: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        #proposal-document.hide-dates .date-display { display: none !important; }
        #proposal-document.hide-dates .date-display-row { display: none !important; }

        .proposal-paper {
          width: 210mm;
          max-width: 100%;
          box-sizing: border-box;
          background-color: #ffffff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          padding: 14mm 14mm;
          color: #333333;
          font-family: 'Inter', 'Sarabun', sans-serif;
          font-size: 12px;
          line-height: 1.55;
          margin-bottom: 40px;
          min-height: 0;
          height: auto;
        }

        @page {
          size: A4 portrait;
          margin: 12mm 14mm 14mm 14mm;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          aside, nav, .toolbar-container, .no-print, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            flex: none !important;
          }
          .proposal-paper, #proposal-document {
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            height: auto !important;
            min-height: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          img {
            max-width: 100% !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .pdf-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="toolbar-container no-print" style={{ width: "100%", maxWidth: "820px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>พรีวิวเอกสาร</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/builder/${plan.id}`} className="btn-secondary" prefetch={false}>
            ← กลับไปแก้ไขแพลน
          </Link>
          <ExportButtons title={plan.title || "Final_Itinerary"} />
        </div>
      </div>

      {/* A4 Document */}
      <div
        id="proposal-document"
        className="proposal-paper"
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
          subheadline={coverDesign?.subheadline}
          badgeText={coverDesign?.badge_text}
          highlightText={coverDesign?.highlight_text}
          priceText={coverDesign?.price_text}
          travelDateText={coverDesign?.travel_date_text}
          themeColor={coverDesign?.theme_color}
          overlayStyle={coverDesign?.overlay_style}
        />

        {/* 2. Package & Price */}
        <PackagePriceSection
          sellingPricePerPerson={plan.selling_price_per_person}
          totalSellingPrice={plan.total_selling_price}
          travelerCount={plan.traveler_count}
          depositAmount={plan.deposit_amount || null}
        />

        {/* 3. Short Itinerary Table */}
        <ShortItinerarySection
          days={plan.TourDays}
          title={plan.title}
          duration={plan.duration}
          startDate={plan.start_date}
          endDate={plan.end_date}
          airline={plan.airline}
          flightRoute={plan.flight_route}
          outboundFlight={plan.outbound_flight}
          returnFlight={plan.return_flight}
          hotelLevel={plan.hotel_level}
        />

        {/* 4. Inclusions & Exclusions */}
        <InclusionExclusionSection
          inclusions={plan.Inclusions}
          exclusions={plan.Exclusions}
        />

        {/* 5. Daily Itinerary */}
        <DailyItinerarySection days={plan.TourDays} hotelLevel={plan.hotel_level} />

        {/* Footer */}
        <div className="pdf-footer page-break-avoid" style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #eee", textAlign: "center", fontSize: "10.5px", color: "#999", breakInside: "avoid", pageBreakInside: "avoid" }}>
          PR Global Travel Group Co., Ltd. | เอกสารนี้จัดทำโดยทีมงาน PR Travel สำหรับลูกค้าเท่านั้น
        </div>
      </div>
    </div>
  );
}
