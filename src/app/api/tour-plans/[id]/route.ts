import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const planRef = adminDb.collection("tour_plans").doc(id);

    const travelerCount = body.traveler_count !== undefined && body.traveler_count !== null && body.traveler_count !== ""
      ? parseInt(body.traveler_count)
      : undefined;

    const sellingPricePerPerson = body.selling_price_per_person !== undefined && body.selling_price_per_person !== null && body.selling_price_per_person !== ""
      ? parseFloat(body.selling_price_per_person)
      : undefined;

    let totalSellingPrice: number | undefined = undefined;
    if (sellingPricePerPerson !== undefined && travelerCount !== undefined) {
      totalSellingPrice = sellingPricePerPerson * travelerCount;
    } else if (body.total_selling_price !== undefined && body.total_selling_price !== null && body.total_selling_price !== "") {
      totalSellingPrice = parseFloat(body.total_selling_price);
    }

    const planUpdateData: Record<string, any> = {
      updated_at: new Date()
    };
    if (body.title !== undefined) planUpdateData.title = body.title;
    if (body.tour_code !== undefined) planUpdateData.tour_code = body.tour_code;
    if (body.duration !== undefined) planUpdateData.duration = parseInt(body.duration);
    if (body.traveler_count !== undefined) planUpdateData.traveler_count = parseInt(body.traveler_count);
    if (body.trip_type !== undefined) planUpdateData.trip_type = body.trip_type;
    if (body.airline !== undefined) planUpdateData.airline = body.airline;
    if (body.flight_route !== undefined) planUpdateData.flight_route = body.flight_route;
    if (body.outbound_flight !== undefined) planUpdateData.outbound_flight = body.outbound_flight;
    if (body.return_flight !== undefined) planUpdateData.return_flight = body.return_flight;
    if (body.start_date && !isNaN(new Date(body.start_date).getTime())) planUpdateData.start_date = new Date(body.start_date);
    if (body.end_date && !isNaN(new Date(body.end_date).getTime())) planUpdateData.end_date = new Date(body.end_date);
    if (body.hotel_level !== undefined) planUpdateData.hotel_level = body.hotel_level;
    if (body.hero_image_url !== undefined) planUpdateData.hero_image_url = body.hero_image_url;
    if (sellingPricePerPerson !== undefined) planUpdateData.selling_price_per_person = sellingPricePerPerson;
    if (totalSellingPrice !== undefined) planUpdateData.total_selling_price = totalSellingPrice;
    if (body.status !== undefined) planUpdateData.status = body.status;

    // Fetch current inclusions, exclusions, and day activity collections in PARALLEL
    const incSnapPromise = body.Inclusions ? planRef.collection("inclusions").get() : null;
    const excSnapPromise = body.Exclusions ? planRef.collection("exclusions").get() : null;
    const dayActsPromises = (body.TourDays && Array.isArray(body.TourDays))
      ? body.TourDays.map((day: any) => planRef.collection("days").doc(day.id).collection("activities").get())
      : [];

    const [incSnap, excSnap, ...dayActsSnaps] = await Promise.all([
      incSnapPromise,
      excSnapPromise,
      ...dayActsPromises
    ]);

    const batch = adminDb.batch();

    // 1. Update main plan doc
    batch.set(planRef, planUpdateData, { merge: true });

    // 2. Inclusions
    if (body.Inclusions && Array.isArray(body.Inclusions) && incSnap) {
      const currIncIds = new Set(body.Inclusions.filter((x: any) => !x.isNew).map((x: any) => x.id));
      for (const doc of incSnap.docs) {
        if (!currIncIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      }
      for (let idx = 0; idx < body.Inclusions.length; idx++) {
        const inc = body.Inclusions[idx];
        const incId = inc.isNew || !inc.id ? planRef.collection("inclusions").doc().id : inc.id;
        const incRef = planRef.collection("inclusions").doc(incId);
        batch.set(incRef, {
          tour_plan_id: id,
          item_text: inc.item_text || "",
          sort_order: idx,
          updated_at: new Date()
        }, { merge: true });
      }
    }

    // 3. Exclusions
    if (body.Exclusions && Array.isArray(body.Exclusions) && excSnap) {
      const currExcIds = new Set(body.Exclusions.filter((x: any) => !x.isNew).map((x: any) => x.id));
      for (const doc of excSnap.docs) {
        if (!currExcIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      }
      for (let idx = 0; idx < body.Exclusions.length; idx++) {
        const exc = body.Exclusions[idx];
        const excId = exc.isNew || !exc.id ? planRef.collection("exclusions").doc().id : exc.id;
        const excRef = planRef.collection("exclusions").doc(excId);
        batch.set(excRef, {
          tour_plan_id: id,
          item_text: exc.item_text || "",
          sort_order: idx,
          updated_at: new Date()
        }, { merge: true });
      }
    }

    // 4. Tour Days & Activities
    if (body.TourDays && Array.isArray(body.TourDays)) {
      for (let dIdx = 0; dIdx < body.TourDays.length; dIdx++) {
        const day = body.TourDays[dIdx];
        const dayRef = planRef.collection("days").doc(day.id);

        batch.set(dayRef, {
          day_title: day.day_title || "",
          city: day.city || "",
          hotel_name: day.hotel_name || "",
          breakfast_included: Boolean(day.breakfast_included),
          lunch_included: Boolean(day.lunch_included),
          dinner_included: Boolean(day.dinner_included),
          actual_date: day.actual_date && !isNaN(new Date(day.actual_date).getTime()) ? new Date(day.actual_date) : null,
          updated_at: new Date()
        }, { merge: true });

        if (day.TourActivities && Array.isArray(day.TourActivities)) {
          const actSnap = dayActsSnaps[dIdx];
          if (actSnap) {
            const currActIds = new Set(day.TourActivities.filter((a: any) => !a.isNew).map((a: any) => a.id));
            for (const doc of actSnap.docs) {
              if (!currActIds.has(doc.id)) {
                batch.delete(doc.ref);
              }
            }
          }

          for (let aIdx = 0; aIdx < day.TourActivities.length; aIdx++) {
            const act = day.TourActivities[aIdx];
            const actId = act.isNew || !act.id ? dayRef.collection("activities").doc().id : act.id;
            const actRef = dayRef.collection("activities").doc(actId);
            batch.set(actRef, {
              tour_day_id: day.id,
              time_text: act.time_text || "",
              activity_title: act.activity_title || "",
              activity_description: act.activity_description || "",
              location_name: act.location_name || act.activity_title || "",
              sort_order: aIdx,
              updated_at: new Date()
            }, { merge: true });
          }
        }
      }
    }

    // Single atomic batch commit
    await batch.commit();

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
