import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { ai, safeJsonParse, validateAIPlan, buildFallbackPlan, sanitizeHotelName } from "@/lib/ai";
import { estimateMarketPrice } from "@/lib/pricing";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const pax = parseInt(data.travelerCount) || 1;
    const duration = parseInt(data.duration) || 3;
    const tourCode = `PR-${(data.country || "TOUR").substring(0, 3).toUpperCase()}-${new Date().getTime().toString().slice(-4)}`;

    // 1. Calculate / estimate realistic market price if not specified
    const rawBudget = parseFloat(data.budgetPerPerson) || 0;
    const marketEstimate = estimateMarketPrice({
      country: data.country,
      city: data.mainCity,
      duration: duration,
      hotelLevel: data.hotelLevel || "4 ดาว",
      tripType: data.tripType || "Private Tour",
      travelerCount: pax,
    });

    const finalSellingPricePerPerson = rawBudget > 0 ? rawBudget : marketEstimate.sellingPricePerPerson;
    const finalTotalSellingPrice = finalSellingPricePerPerson * pax;

    // Initialize Batch for single atomic commit
    const batch = adminDb.batch();

    // 2. Prepare Customer
    const customerRef = adminDb.collection("customers").doc();
    const customerId = customerRef.id;
    batch.set(customerRef, {
      id: customerId,
      name: data.customerName || "ลูกค้าทั่วไป",
      phone: data.phone || "",
      line_id: data.lineId || "",
      customer_type: data.customerType || "Family",
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 3. AI Itinerary Generation Prompt
    const userPromptContent = (data.customerNote && data.customerNote.trim().length > 0)
      ? `\n=======================================================\n[คำสั่งและข้อมูลตั้งต้นหลักจากผู้ใช้ (USER PROMPT DIRECTIVE)]\n${data.customerNote.trim()}\n=======================================================\n`
      : "";

    const systemPrompt = `คุณคือ AI ผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม (PR Travel Itinerary Architect)
หน้าที่ของคุณคือการนำข้อมูลและคำสั่งจากผู้ใช้มาประมวลผล สร้างเป็นโปรแกรมทัวร์ฉบับสมบูรณ์ พร้อมออกเอกสารเสนอขายลูกค้าทันที

[ข้อมูลการเดินทางพื้นฐาน]
- ชื่อลูกค้า: ${data.customerName || "ลูกค้าทั่วไป"}
- ประเทศปลายทาง: ${data.country}
- เมืองหลัก: ${data.mainCity} ${data.secondaryCity ? `และ ${data.secondaryCity}` : ""}
- จำนวนผู้เดินทาง: ${pax} ท่าน
- ระยะเวลาของทริป: ${duration} วัน (${duration - 1} คืน)
- วันที่เริ่มต้น: ${data.startDate || "2026-11-01"}
- ประเภททริป: ${data.tripType || "Private Tour"}
- ระดับโรงแรมที่ต้องการ: ${data.hotelLevel || "3 ดาว"}
${userPromptContent}
[กฎและหลักการประมวลผลข้อมูล (สำคัญสูงสุด)]
1. ช่อง "USER PROMPT DIRECTIVE (คำสั่งและข้อมูลตั้งต้นหลัก)" ด้านบนเปรียบเสมือน Master Prompt จากผู้ใช้:
   - หากมีการระบุไฟลท์บิน (สายการบิน, เวลาบิน, หมายเลขเที่ยวบิน) คุณต้องสกัดมาใส่ในวันแรกและวันสุดท้ายให้ครบถ้วน 100%
   - หากมีการระบุสถานที่ท่องเที่ยว โรงแรม หรือเงื่อนไขเฉพาะ คุณต้องนำมารวมในแผนการเดินทางทั้งหมด
2. โครงสร้าง JSON ที่ส่งกลับต้องครอบคลุม:
   - tour_name: ชื่อโปรแกรมทัวร์ภาษาไทยน่าดึงดูด
   - airline, flight_route, outbound_flight, return_flight
   - itinerary: อาร์เรย์ของวัน (${duration} วัน) แต่ละวันมี daily_theme, hotel_name_suggestion, breakfast_included, lunch_included, dinner_included, และ activities (อาร์เรย์ของกิจกรรม มี time_period, location_name, activity_title, description, is_highlight)
ตอบกลับเฉพาะ JSON บริสุทธิ์เท่านั้น (ไม่มี markdown code block หรือคำอธิบายอื่น)`;

    let aiPlan: any = null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        config: { responseMimeType: "application/json" }
      });
      aiPlan = safeJsonParse(response.text);
    } catch (e) {
      console.warn("AI generation call failed or timed out, using smart fallback", e);
    }

    if (!aiPlan || !validateAIPlan(aiPlan, duration)) {
      aiPlan = buildFallbackPlan(data.mainCity, data.country, duration, data.startDate || new Date().toISOString(), data.hotelLevel, data.customerNote);
    }

    // 4. Hero image fallback
    let heroImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80";
    const destLower = `${data.mainCity} ${data.country}`.toLowerCase();
    if (destLower.includes("macao") || destLower.includes("macau") || destLower.includes("มาเก๊า")) {
      heroImageUrl = "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("hong kong") || destLower.includes("ฮ่องกง")) {
      heroImageUrl = "https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("japan") || destLower.includes("tokyo") || destLower.includes("ญี่ปุ่น")) {
      heroImageUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("china") || destLower.includes("chengdu") || destLower.includes("เฉิงตู") || destLower.includes("จีน")) {
      heroImageUrl = "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&auto=format&fit=crop&q=80";
    }

    // 5. Prepare Plan
    const planRef = adminDb.collection("tour_plans").doc();
    const planId = planRef.id;

    const startDateObj = data.startDate && !isNaN(new Date(data.startDate).getTime()) ? new Date(data.startDate) : new Date();
    const endDateObj = data.endDate && !isNaN(new Date(data.endDate).getTime()) ? new Date(data.endDate) : new Date(startDateObj.getTime() + duration * 86400000);

    batch.set(planRef, {
      id: planId,
      customer_id: customerId,
      tour_code: tourCode,
      title: aiPlan.tour_name || `${data.mainCity} Tour ${duration}D${duration - 1}N`,
      country: data.country || "",
      main_city: data.mainCity || "",
      secondary_city: data.secondaryCity || "",
      start_date: startDateObj,
      end_date: endDateObj,
      duration: duration,
      trip_type: data.tripType || "Private Tour",
      theme: data.theme || "Nature",
      traveler_count: pax,
      hotel_level: data.hotelLevel || "4 ดาว",
      budget_per_person: finalSellingPricePerPerson,
      selling_price_per_person: finalSellingPricePerPerson,
      total_selling_price: finalTotalSellingPrice,
      cost_per_person: marketEstimate.costPerPerson,
      total_cost: marketEstimate.costPerPerson * pax,
      profit_amount: finalTotalSellingPrice - (marketEstimate.costPerPerson * pax),
      profit_percent: 22,
      status: "Draft",
      customer_note: data.customerNote || "",
      hero_image_url: heroImageUrl,
      airline: aiPlan.airline || "Thai Airways / Greater Bay Airlines",
      flight_route: aiPlan.flight_route || `BKK - ${data.mainCity} - BKK`,
      outbound_flight: aiPlan.outbound_flight || "HB296 BKK 01:55 - 06:00 HKG",
      return_flight: aiPlan.return_flight || "HB295 HKG 22:15 - 00:15 BKK",
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 6. Save Days and Activities via Batch
    if (aiPlan.itinerary && Array.isArray(aiPlan.itinerary)) {
      for (const dayData of aiPlan.itinerary) {
        const dayActualDate = dayData.date && !isNaN(new Date(dayData.date).getTime())
          ? new Date(dayData.date)
          : new Date(startDateObj.getTime() + (dayData.day_number - 1) * 24 * 60 * 60 * 1000);

        const dayRef = planRef.collection("days").doc();
        const dayId = dayRef.id;

        batch.set(dayRef, {
          id: dayId,
          tour_plan_id: planId,
          day_number: dayData.day_number,
          actual_date: dayActualDate,
          day_title: dayData.daily_theme || "",
          city: data.mainCity || "",
          hotel_name: sanitizeHotelName(dayData.hotel_name_suggestion, data.hotelLevel),
          breakfast_included: dayData.breakfast_included ?? (dayData.day_number > 1),
          lunch_included: dayData.lunch_included ?? (dayData.day_number > 1 && dayData.day_number < duration),
          dinner_included: dayData.dinner_included ?? (dayData.day_number < duration),
          sort_order: dayData.day_number,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (dayData.activities && Array.isArray(dayData.activities)) {
          for (let i = 0; i < dayData.activities.length; i++) {
            const activity = dayData.activities[i];
            const actRef = dayRef.collection("activities").doc();
            batch.set(actRef, {
              id: actRef.id,
              tour_day_id: dayId,
              time_text: activity.time_period || activity.time_start || "",
              activity_title: activity.activity_title || activity.location_name || "",
              activity_description: activity.description || "",
              location_name: activity.location_name || "",
              is_highlight: activity.is_highlight ?? false,
              sort_order: i + 1,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        }
      }
    }

    // Atomic commit for all items
    await batch.commit();

    return NextResponse.json({ success: true, planId: planId });
  } catch (error: any) {
    console.error("Error generating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan: " + (error.message || String(error)) }, { status: 500 });
  }
}
