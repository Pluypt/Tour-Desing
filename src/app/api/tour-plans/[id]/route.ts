import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1. Update Plan details
    const sellingPricePerPerson = body.selling_price_per_person !== undefined && body.selling_price_per_person !== null && body.selling_price_per_person !== ""
      ? parseFloat(body.selling_price_per_person)
      : undefined;

    const totalSellingPrice = body.total_selling_price !== undefined && body.total_selling_price !== null && body.total_selling_price !== ""
      ? parseFloat(body.total_selling_price)
      : (sellingPricePerPerson && body.traveler_count ? sellingPricePerPerson * parseInt(body.traveler_count) : undefined);

    await prisma.tourPlan.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        tour_code: body.tour_code ?? undefined,
        duration: body.duration ? parseInt(body.duration) : undefined,
        traveler_count: body.traveler_count ? parseInt(body.traveler_count) : undefined,
        trip_type: body.trip_type ?? undefined,
        airline: body.airline ?? undefined,
        flight_route: body.flight_route ?? undefined,
        outbound_flight: body.outbound_flight ?? undefined,
        return_flight: body.return_flight ?? undefined,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
        hotel_level: body.hotel_level ?? undefined,
        hero_image_url: body.hero_image_url ?? undefined,
        selling_price_per_person: sellingPricePerPerson,
        total_selling_price: totalSellingPrice,
        status: body.status || "Draft",
        updated_at: new Date()
      }
    });

    // 2. Handle Inclusions
    if (body.Inclusions && Array.isArray(body.Inclusions)) {
      const existingIncs = await prisma.inclusion.findMany({ where: { tour_plan_id: id } });
      const currIncIds = body.Inclusions.filter((x: any) => !x.isNew).map((x: any) => x.id);
      for (const toDelete of existingIncs.filter((x: any) => !currIncIds.includes(x.id))) {
        await prisma.inclusion.delete({ where: { id: toDelete.id } });
      }
      for (const idx in body.Inclusions) {
        const inc = body.Inclusions[idx];
        if (inc.isNew) {
          await prisma.inclusion.create({
            data: { tour_plan_id: id, item_text: inc.item_text, sort_order: parseInt(idx) }
          });
        } else {
          await prisma.inclusion.update({
            where: { id: inc.id },
            data: { item_text: inc.item_text, sort_order: parseInt(idx) }
          });
        }
      }
    }

    // 3. Handle Exclusions
    if (body.Exclusions && Array.isArray(body.Exclusions)) {
      const existingExcs = await prisma.exclusion.findMany({ where: { tour_plan_id: id } });
      const currExcIds = body.Exclusions.filter((x: any) => !x.isNew).map((x: any) => x.id);
      for (const toDelete of existingExcs.filter((x: any) => !currExcIds.includes(x.id))) {
        await prisma.exclusion.delete({ where: { id: toDelete.id } });
      }
      for (const idx in body.Exclusions) {
        const exc = body.Exclusions[idx];
        if (exc.isNew) {
          await prisma.exclusion.create({
            data: { tour_plan_id: id, item_text: exc.item_text, sort_order: parseInt(idx) }
          });
        } else {
          await prisma.exclusion.update({
            where: { id: exc.id },
            data: { item_text: exc.item_text, sort_order: parseInt(idx) }
          });
        }
      }
    }

    // 4. Update Days and Activities
    if (body.TourDays && Array.isArray(body.TourDays)) {
      for (const day of body.TourDays) {
        await prisma.tourDay.update({
          where: { id: day.id },
          data: {
            day_title: day.day_title,
            city: day.city,
            hotel_name: day.hotel_name,
            breakfast_included: Boolean(day.breakfast_included),
            lunch_included: Boolean(day.lunch_included),
            dinner_included: Boolean(day.dinner_included),
            actual_date: day.actual_date ? new Date(day.actual_date) : undefined,
          }
        });

        // Handle Activities (Delete, Update, Create)
        if (day.TourActivities && Array.isArray(day.TourActivities)) {
          const existingActivities = await prisma.tourActivity.findMany({ where: { tour_day_id: day.id } });
          const currentActivityIds = day.TourActivities.filter((a: any) => !a.isNew).map((a: any) => a.id);
          
          // Delete removed activities
          const activitiesToDelete = existingActivities.filter((a: any) => !currentActivityIds.includes(a.id));
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
                  time_text: act.time_text || "",
                  activity_title: act.activity_title || "",
                  activity_description: act.activity_description || "",
                  location_name: act.location_name || act.activity_title || "",
                  sort_order: parseInt(idx),
                }
              });
            } else {
              await prisma.tourActivity.update({
                where: { id: act.id },
                data: {
                  time_text: act.time_text || "",
                  activity_title: act.activity_title || "",
                  activity_description: act.activity_description || "",
                  location_name: act.location_name || act.activity_title || "",
                  sort_order: parseInt(idx),
                }
              });
            }
          }
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
