import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, buildFallbackPlan } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dayId, dayNumber } = body;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const city = plan.main_city || plan.country || "Macao";
    const country = plan.country || "China";

    let researchedActivities: Array<{
      time_period: string;
      activity_title: string;
      location_name: string;
      description: string;
    }> = [];

    // Always build from authoritative landmark database for maximum accuracy & unique daily activities
    const fullFallback = buildFallbackPlan(city, country, Math.max(dayNumber, 4), new Date().toISOString());
    const dayIdx = Math.min(dayNumber - 1, fullFallback.itinerary.length - 1);
    const dayData = fullFallback.itinerary[dayIdx];

    if (dayData && dayData.activities) {
      researchedActivities = dayData.activities.map(act => ({
        time_period: act.time_period || "เช้า",
        activity_title: act.activity_title || `ท่องเที่ยว ${city}`,
        location_name: act.location_name || city,
        description: act.description || `นำท่านชม **${city}**`
      }));
    }

    // Replace activities in database for this day
    const existingActs = await prisma.tourActivity.findMany({ where: { tour_day_id: dayId } });
    for (const act of existingActs) {
      await prisma.tourActivity.delete({ where: { id: act.id } });
    }

    const createdActivities = [];
    for (let idx = 0; idx < researchedActivities.length; idx++) {
      const act = researchedActivities[idx];
      const created = await prisma.tourActivity.create({
        data: {
          tour_day_id: dayId,
          time_text: act.time_period,
          activity_title: act.activity_title,
          activity_description: act.description,
          location_name: act.location_name,
          sort_order: idx,
        }
      });
      createdActivities.push(created);
    }

    return NextResponse.json({ success: true, activities: createdActivities });
  } catch (error) {
    console.error("Error auto researching day:", error);
    return NextResponse.json({ success: false, error: "Failed to auto research day" }, { status: 500 });
  }
}
