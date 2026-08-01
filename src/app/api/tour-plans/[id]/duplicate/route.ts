import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const originalPlan = await prisma.tourPlan.findUnique({
      where: { id },
      include: {
        TourDays: {
          include: {
            TourActivities: true,
            TourDayImages: true
          }
        },
        Inclusions: true,
        Exclusions: true,
        CostItems: true,
      }
    });

    if (!originalPlan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    // Create a duplicated plan
    const newPlan = await prisma.tourPlan.create({
      data: {
        tour_code: `${originalPlan.tour_code || "PR"}-COPY`,
        customer_id: originalPlan.customer_id,
        title: `${originalPlan.title || "Tour Plan"} (คัดลอก)`,
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
        selling_price_per_person: originalPlan.selling_price_per_person,
        total_selling_price: originalPlan.total_selling_price,
        airline: originalPlan.airline,
        flight_route: originalPlan.flight_route,
        outbound_flight: originalPlan.outbound_flight,
        return_flight: originalPlan.return_flight,
        hero_image_url: originalPlan.hero_image_url,
        status: "Draft",
        customer_note: originalPlan.customer_note,
      }
    });

    // Duplicate Inclusions
    if (originalPlan.Inclusions) {
      for (const inc of originalPlan.Inclusions) {
        await prisma.inclusion.create({
          data: { tour_plan_id: newPlan.id, item_text: inc.item_text, sort_order: inc.sort_order }
        });
      }
    }

    // Duplicate Exclusions
    if (originalPlan.Exclusions) {
      for (const exc of originalPlan.Exclusions) {
        await prisma.exclusion.create({
          data: { tour_plan_id: newPlan.id, item_text: exc.item_text, sort_order: exc.sort_order }
        });
      }
    }

    // Duplicate Cost Items
    if (originalPlan.CostItems) {
      for (const cost of originalPlan.CostItems) {
        await prisma.tourCostItem.create({
          data: {
            tour_plan_id: newPlan.id,
            category: cost.category,
            item_name: cost.item_name,
            cost_type: cost.cost_type,
            quantity: cost.quantity,
            unit_cost: cost.unit_cost,
            total_cost: cost.total_cost,
            is_internal: cost.is_internal,
            note: cost.note,
            sort_order: cost.sort_order
          }
        });
      }
    }

    // Duplicate days, activities, and images
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

      if (day.TourDayImages) {
        for (const img of day.TourDayImages) {
          await prisma.tourDayImage.create({
            data: {
              tour_day_id: newDay.id,
              image_url: img.image_url,
              thumbnail_url: img.thumbnail_url,
              source_url: img.source_url,
              source_title: img.source_title,
              photographer: img.photographer,
              provider: img.provider,
              location_name: img.location_name,
              search_keyword: img.search_keyword,
              alt_text: img.alt_text,
              caption: img.caption,
              is_selected: img.is_selected,
              sort_order: img.sort_order
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, newPlanId: newPlan.id });
  } catch (error) {
    console.error("Error duplicating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to duplicate plan" }, { status: 500 });
  }
}
