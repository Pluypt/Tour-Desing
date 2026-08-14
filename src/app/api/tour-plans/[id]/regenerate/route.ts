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

    // 1. Try Gemini AI with strict rules (Day 1 & Last Day pure travel, Middle days Lemon8 trendy spots)
    let aiPlan: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม และ Content Creator สไตล์ Lemon8 หน้าที่ของคุณคือการสร้างแผนการเดินทางใหม่ทั้งหมดสำหรับทริปนี้

[ตัวแปรข้อมูลเข้า]
จุดหมายปลายทาง: ${country}, ${mainCity} ${plan.secondary_city ? `และ ${plan.secondary_city}` : ""}
ระยะเวลา: ${duration} วัน
จำนวนผู้เดินทาง: ${plan.traveler_count || 2} ท่าน
ธีมการท่องเที่ยว: ${plan.theme || "ท่องเที่ยวไฮไลต์ คาเฟ่ชิค มุมถ่ายรูปสไตล์ Lemon8"}
ระดับโรงแรม: ${plan.hotel_level || "4 ดาว"}

[กฎเหล็กในการสร้างเนื้อหา]
1. วันแรก (DAY 1): ต้องเน้นการเดินทางเท่านั้น (นัดหมายสนามบินสุวรรณภูมิ, เที่ยวบิน, ผ่านตม., รับกระเป๋า, เข้าสู่ที่พัก, พักผ่อน) **ห้ามใส่สถานที่ท่องเที่ยวในวันแรก**
2. วันสุดท้าย (LAST DAY): ต้องเน้นการเดินทางกลับเท่านั้น (อาหารเช้า, เช็คเอาท์, เดินทางสู่สนามบิน, เช็คอินโหลดกระเป๋า, บินกลับกรุงเทพฯ สุวรรณภูมิ) **ห้ามใส่สถานที่ท่องเที่ยวในวันสุดท้าย**
3. วันระหว่างทริป (DAY 2 ถึง DAY ${duration - 1}): จัดเต็มแลนด์มาร์กใหม่ มุมถ่ายรูปยอดฮิต คาเฟ่ aesthetic จุดเช็คอินสไตล์ Lemon8 / Xiaohongshu / Instagram ที่เป็นไฮไลต์จริงของเมืองนั้นๆ มีเน้นตัวหนา **[ชื่อสถานที่/คาเฟ่]**

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
      "hotel_name_suggestion": "ชื่อโรงแรมจริง 4 ดาว",
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
      aiPlan = buildFallbackPlan(mainCity, country, duration, startDateStr);
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
            hotel_name: dayData.hotel_name_suggestion || `โรงแรมระดับ 4 ดาว เมือง ${mainCity}`,
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
