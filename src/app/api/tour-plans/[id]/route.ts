import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // The body contains the full plan with nested TourDays and TourActivities
    // We will update the days and activities. Since we might have added/deleted activities,
    // a simple approach for MVP is to update days, and upsert activities or delete missing ones.

    // Update Plan details
    await prisma.tourPlan.update({
      where: { id },
      data: {
        title: body.title,
        status: "Draft",
        updated_at: new Date()
      }
    });

    // Update Days and Activities
    for (const day of body.TourDays) {
      await prisma.tourDay.update({
        where: { id: day.id },
        data: {
          day_title: day.day_title,
          city: day.city,
          hotel_name: day.hotel_name,
          breakfast_included: day.breakfast_included,
          lunch_included: day.lunch_included,
          dinner_included: day.dinner_included,
        }
      });

      // Handle Activities (Delete, Update, Create)
      const existingActivities = await prisma.tourActivity.findMany({ where: { tour_day_id: day.id } });
      const currentActivityIds = day.TourActivities.filter((a: any) => !a.isNew).map((a: any) => a.id);
      
      // Delete removed activities
      const activitiesToDelete = existingActivities.filter(a => !currentActivityIds.includes(a.id));
      for (const toDelete of activitiesToDelete) {
        await prisma.tourActivity.delete({ where: { id: toDelete.id } });
      }

      // Upsert current activities
      for (const idx in day.TourActivities) {
        const act = day.TourActivities[idx];
        if (act.isNew) {
          await prisma.tourActivity.create({
            data: {
              tour_day_id: day.id,
              time_text: act.time_text,
              activity_title: act.activity_title,
              activity_description: act.activity_description,
              sort_order: parseInt(idx),
            }
          });
        } else {
          await prisma.tourActivity.update({
            where: { id: act.id },
            data: {
              time_text: act.time_text,
              activity_title: act.activity_title,
              activity_description: act.activity_description,
              sort_order: parseInt(idx),
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving plan:", error);
    return NextResponse.json({ success: false, error: "Failed to save plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tourPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({ success: false, error: "Failed to delete plan" }, { status: 500 });
  }
}
