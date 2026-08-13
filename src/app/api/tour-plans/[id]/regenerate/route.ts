import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse, validateAIPlan, buildFallbackPlan } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const mainCity = plan.main_city || "คุนหมิง";
    const country = plan.country || "จีน";
    const duration = plan.duration || 4;
    const startDateStr = plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Build authoritative high-accuracy plan using verified Landmark Database
    const aiPlan = buildFallbackPlan(mainCity, country, duration, startDateStr);

    // 2. Update Plan metadata
    await prisma.tourPlan.update({
      where: { id },
      data: {
        title: aiPlan.tour_name || plan.title,
        airline: aiPlan.airline || plan.airline,
        flight_route: aiPlan.flight_route || plan.flight_route,
        outbound_flight: aiPlan.outbound_flight || plan.outbound_flight,
        return_flight: aiPlan.return_flight || plan.return_flight,
      }
    });

    // 3. Replace TourDays and TourActivities in place for this plan
    const existingDays = await prisma.tourDay.findMany({
      where: { tour_plan_id: id },
      include: { TourActivities: true }
    });

    for (const day of existingDays) {
      for (const act of day.TourActivities) {
        await prisma.tourActivity.delete({ where: { id: act.id } });
      }
      await prisma.tourDay.delete({ where: { id: day.id } });
    }

    // 4. Re-create days and activities
    if (aiPlan.itinerary && Array.isArray(aiPlan.itinerary)) {
      for (const dayData of aiPlan.itinerary) {
        const day = await prisma.tourDay.create({
          data: {
            tour_plan_id: id,
            day_number: dayData.day_number,
            actual_date: dayData.date ? new Date(dayData.date) : new Date(new Date(startDateStr).getTime() + (dayData.day_number - 1) * 24 * 60 * 60 * 1000),
            day_title: dayData.daily_theme,
            city: mainCity,
            hotel_name: dayData.hotel_name_suggestion || `โรงแรมระดับ 4 ดาว เมือง ${mainCity}`,
            breakfast_included: dayData.breakfast_included ?? (dayData.day_number > 1),
            lunch_included: dayData.lunch_included ?? true,
            dinner_included: dayData.dinner_included ?? (dayData.day_number < duration),
            sort_order: dayData.day_number,
          }
        });

        if (dayData.activities && Array.isArray(dayData.activities)) {
          for (let actIdx = 0; actIdx < dayData.activities.length; actIdx++) {
            const actData = dayData.activities[actIdx];
            await prisma.tourActivity.create({
              data: {
                tour_day_id: day.id,
                time_text: actData.time_period || "เช้า",
                activity_title: actData.activity_title || `ท่องเที่ยว ${mainCity}`,
                activity_description: actData.description || `นำท่านชม **${mainCity}**`,
                location_name: actData.location_name || mainCity,
                is_highlight: actData.is_highlight ?? false,
                sort_order: actIdx,
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Regenerated plan in-place successfully" });
  } catch (error) {
    console.error("In-place regenerate error:", error);
    return NextResponse.json({ success: false, error: "Failed to regenerate plan" }, { status: 500 });
  }
}
