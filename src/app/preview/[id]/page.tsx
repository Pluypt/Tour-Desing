import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportButtons from "./ExportButtons";

const prisma = new PrismaClient();

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      TourDays: {
        orderBy: { sort_order: "asc" },
        include: {
          TourActivities: {
            orderBy: { sort_order: "asc" }
          }
        }
      }
    }
  });

  if (!plan) return notFound();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>พรีวิวเอกสารนำเสนอ (Proposal Preview)</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/builder/${plan.id}`} className="btn-secondary">แก้ไขแพลน</Link>
          <ExportButtons title={plan.title || "Tour_Proposal"} />
        </div>
      </div>

      {/* A4 Paper Preview */}
      <div id="proposal-document" style={{ 
        width: "210mm", 
        minHeight: "297mm", 
        backgroundColor: "white", 
        boxShadow: "0 0 20px rgba(0,0,0,0.1)", 
        padding: "20mm",
        color: "#333",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Cover Page */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 style={{ color: "#D32F2F", fontSize: "32px", marginBottom: "10px" }}>PR TRAVEL GROUP</h1>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "50px" }}>บริการแพ็กเกจทัวร์ต่างประเทศครบวงจร</p>
          
          <div style={{ width: "100%", height: "300px", backgroundColor: "#eee", borderRadius: "12px", marginBottom: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
            [Hero Image Placeholder]
          </div>

          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>TOUR PROPOSAL</h2>
          <h3 style={{ fontSize: "28px", color: "#333", marginBottom: "10px" }}>{plan.title}</h3>
          
          <div style={{ display: "inline-block", textAlign: "left", marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
            <p style={{ marginBottom: "8px" }}><strong>Tour Code:</strong> {plan.tour_code}</p>
            <p style={{ marginBottom: "8px" }}><strong>Travel Dates:</strong> {plan.start_date?.toLocaleDateString()} - {plan.end_date?.toLocaleDateString()}</p>
            <p style={{ marginBottom: "8px" }}><strong>Duration:</strong> {plan.duration} Days {plan.duration ? plan.duration - 1 : 0} Nights</p>
            <p style={{ marginBottom: "8px" }}><strong>Passengers:</strong> {plan.traveler_count} Pax</p>
            <p style={{ margin: 0 }}><strong>Prepared for:</strong> {plan.customer?.name}</p>
          </div>
        </div>

        {/* Daily Itinerary */}
        <div style={{ pageBreakBefore: "always" }}>
          <h2 style={{ color: "#D32F2F", borderBottom: "2px solid #D32F2F", paddingBottom: "10px", marginBottom: "30px" }}>DAILY ITINERARY</h2>
          
          {plan.TourDays.map((day: any) => (
            <div key={day.id} style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "8px" }}>
                <div style={{ backgroundColor: "#D32F2F", color: "white", padding: "5px 15px", borderRadius: "4px", fontWeight: "bold" }}>DAY {day.day_number}</div>
                <h3 style={{ margin: 0, fontSize: "18px" }}>{day.day_title}</h3>
              </div>
              
              <div style={{ paddingLeft: "20px", borderLeft: "2px solid #eee", marginLeft: "20px" }}>
                {day.TourActivities.map((activity: any) => (
                  <div key={activity.id} style={{ marginBottom: "20px", position: "relative" }}>
                    <div style={{ position: "absolute", left: "-27px", top: "5px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#D32F2F" }}></div>
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      <span style={{ color: "#D32F2F", marginRight: "10px" }}>{activity.time_text}</span>
                      {activity.activity_title}
                    </p>
                    <p style={{ color: "#666", lineHeight: "1.6" }}>{activity.activity_description}</p>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: "20px", backgroundColor: "#fff5f5", padding: "15px", borderRadius: "8px", fontSize: "14px", border: "1px solid #ffebeb" }}>
                <p style={{ marginBottom: "5px" }}><strong>Hotel:</strong> {day.hotel_name || "N/A"}</p>
                <p style={{ margin: 0 }}><strong>Meals:</strong> 
                  {day.breakfast_included ? " Breakfast |" : ""}
                  {day.lunch_included ? " Lunch |" : ""}
                  {day.dinner_included ? " Dinner" : ""}
                  {!day.breakfast_included && !day.lunch_included && !day.dinner_included ? " None" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
