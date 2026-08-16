import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse, validateAIPlan, buildFallbackPlan, sanitizeHotelName } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const mainCity = plan.main_city || "คุนหมิง";
    const country = plan.country || "จีน";
    const duration = plan.duration || 4;
    const startDateStr = plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // 1. Try Gemini AI with strict rules (Day 1 & Last Day pure travel, Middle days landmark highlights)
    let aiPlan: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const userPromptContent = (plan.customer_note && plan.customer_note.trim().length > 0)
          ? `\n=======================================================\n[คำสั่งและข้อมูลตั้งต้นหลักจากผู้ใช้ (USER PROMPT DIRECTIVE)]\n${plan.customer_note.trim()}\n=======================================================\n`
          : "";

        const systemPrompt = `คุณคือ AI ผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม (PR Travel Itinerary Architect)
หน้าที่ของคุณคือการนำข้อมูลและคำสั่งจากผู้ใช้มาประมวลผล สร้างเป็นโปรแกรมทัวร์ฉบับสมบูรณ์

[ตัวแปรข้อมูลเข้า]
จุดหมายปลายทาง: ${country}, ${mainCity} ${plan.secondary_city ? `และ ${plan.secondary_city}` : ""}
ระยะเวลา: ${duration} วัน
จำนวนผู้เดินทาง: ${plan.traveler_count || 2} ท่าน
ธีมการท่องเที่ยว: ${plan.theme || "ท่องเที่ยวไฮไลต์ คาเฟ่ชิค จุดเช็คอินแลนด์มาร์กดัง"}
ระดับโรงแรม: ${plan.hotel_level || "3 ดาว"}
${userPromptContent}
[กฎและหลักการประมวลผลข้อมูล (สำคัญสูงสุด)]
1. ช่อง "USER PROMPT DIRECTIVE (คำสั่งและข้อมูลตั้งต้นหลัก)" ด้านบนเปรียบเสมือน Master Prompt จากผู้ใช้:
   - หากผู้ใช้ระบุแผนรายวัน (เช่น DAY 1, DAY 2, DAY 3, DAY 4...), รายชื่อสถานที่, กิจกรรม, ร้านอาหาร, ข้อกำหนดเวลา หรือเงื่อนไขใดๆ ให้คุณนำข้อมูลทุกบรรทัดมาประมวลผลและบรรจุลงในแผนการเดินทาง (itinerary) ให้ครบถ้วน 100% ห้ามตัดทิ้ง ห้ามตกหล่น
   - หากใน USER PROMPT มีระบุสถานที่ท่องเที่ยว/ช้อปปิ้งในวันแรกหรือวันสุดท้าย ให้จัดกิจกรรมตามที่ผู้ใช้ระบุไว้ทันที
2. ทุกกิจกรรมต้องมี "time_period", "activity_title", "location_name", "description" ที่เขียนบรรยายอย่างมืออาชีพ น่าดึงดูด และเน้นชื่อสถานที่ด้วยตัวหนา **[ชื่อสถานที่]**
3. ระดับโรงแรมใน "hotel_name_suggestion" ต้องตรงตามระดับโรงแรมคือ "${plan.hotel_level || "3 ดาว"}" โดยระบุชื่อโรงแรมตามด้วย "หรือเทียบเท่า ${plan.hotel_level || "3 ดาว"}" เท่านั้น

[รูปแบบ JSON OUTPUT SCHEMA]
{
  "tour_name": "ชื่อโปรแกรมทัวร์",
  "summary": "สรุปภาพรวม",
  "airline": "สายการบิน",
  "flight_route": "เส้นทางบิน",
  "outbound_flight": "รหัสเที่ยวบินขาไป",
  "return_flight": "รหัสเที่ยวบินขากลับ",
  "itinerary": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "daily_theme": "คอนเซปต์ของวัน",
      "hotel_name_suggestion": "ชื่อโรงแรมที่พัก หรือเทียบเท่า ${plan.hotel_level || "3 ดาว"}",
      "breakfast_included": false,
      "lunch_included": true,
      "dinner_included": true,
      "activities": [
        {
          "time_period": "ช่วงเวลา",
          "activity_title": "ชื่อกิจกรรม",
          "location_name": "ชื่อสถานที่",
          "description": "คำบรรยาย",
          "is_highlight": false
        }
      ]
    }
  ]
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: systemPrompt,
          config: { responseMimeType: "application/json" }
        });

        if (aiResponse?.text) {
          const parsed = safeJsonParse(aiResponse.text);
          if (validateAIPlan(parsed)) {
            aiPlan = parsed;
          }
        }
      } catch (aiErr) {
        console.warn("Regenerate Gemini call failed, using verified fallback database:", aiErr);
      }
    }

    if (!aiPlan) {
      aiPlan = buildFallbackPlan(mainCity, country, duration, startDateStr, plan.hotel_level, plan.customer_note || undefined);
    }

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
            hotel_name: sanitizeHotelName(dayData.hotel_name_suggestion, plan.hotel_level),
            breakfast_included: dayData.breakfast_included ?? (dayData.day_number > 1),
            lunch_included: dayData.lunch_included ?? (dayData.day_number > 1 && dayData.day_number < duration),
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
