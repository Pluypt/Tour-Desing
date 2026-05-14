import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const originalPlan = await prisma.tourPlan.findUnique({
      where: { id },
      include: {
        TourDays: {
          include: {
            TourActivities: true
          }
        }
      }
    });

    if (!originalPlan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    // Create a duplicated plan
    const newPlan = await prisma.tourPlan.create({
      data: {
        tour_code: `${originalPlan.tour_code}-COPY`,
        customer_id: originalPlan.customer_id,
        title: `${originalPlan.title} (Copy)`,
        country: originalPlan.country,
        main_city: originalPlan.main_city,
        secondary_city: originalPlan.secondary_city,
        start_date: originalPlan.start_date,
        end_date: originalPlan.end_date,
        duration: originalPlan.duration,
        trip_type: originalPlan.trip_type,
        theme: originalPlan.theme,
        traveler_count: originalPlan.traveler_count,
        hotel_level: originalPlan.hotel_level,
        budget_per_person: originalPlan.budget_per_person,
        status: "Draft",
        customer_note: originalPlan.customer_note,
      }
    });

    // Duplicate days and activities
    for (const day of originalPlan.TourDays) {
      const newDay = await prisma.tourDay.create({
        data: {
          tour_plan_id: newPlan.id,
          day_number: day.day_number,
          actual_date: day.actual_date,
          day_title: day.day_title,
          city: day.city,
          hotel_name: day.hotel_name,
          breakfast_included: day.breakfast_included,
          lunch_included: day.lunch_included,
          dinner_included: day.dinner_included,
          sort_order: day.sort_order,
        }
      });

      for (const act of day.TourActivities) {
        await prisma.tourActivity.create({
          data: {
            tour_day_id: newDay.id,
            time_text: act.time_text,
            activity_title: act.activity_title,
            activity_description: act.activity_description,
            location_name: act.location_name,
            sort_order: act.sort_order,
            image_url: act.image_url,
          }
        });
      }
    }

    return NextResponse.json({ success: true, newPlanId: newPlan.id });
  } catch (error) {
    console.error("Error duplicating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to duplicate plan" }, { status: 500 });
  }
}
