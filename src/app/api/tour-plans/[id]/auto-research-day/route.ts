import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse, buildFallbackPlan } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dayId, dayNumber } = body;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const city = plan.main_city || plan.country || "Macao";
    const country = plan.country || "China";
    const duration = plan.duration || 4;

    let researchedActivities: Array<{
      time_period: string;
      activity_title: string;
      location_name: string;
      description: string;
    }> = [];

    // Try Gemini AI first if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const isFirstDay = dayNumber === 1;
        const isLastDay = dayNumber === duration;

        let ruleInstruction = "";
        if (isFirstDay) {
          ruleInstruction = "นี่คือวันแรกของทริป: ต้องเน้นกิจกรรมการเดินทางเท่านั้น (นัดหมายสนามบินสุวรรณภูมิ, เที่ยวบิน, ผ่านตม., รับสัมภาระ, เข้าสู่ที่พัก, พักผ่อน) ห้ามใส่สถานที่ท่องเที่ยว";
        } else if (isLastDay) {
          ruleInstruction = "นี่คือวันสุดท้ายของทริป: ต้องเน้นกิจกรรมการเดินทางกลับเท่านั้น (รับประทานอาหารเช้า, เช็คเอาท์โรงแรม, เดินทางสู่สนามบิน, เช็คอินโหลดสัมภาระ, บินกลับกรุงเทพฯ) ห้ามใส่สถานที่ท่องเที่ยว";
        } else {
          ruleInstruction = "นี่คือวันระหว่างทริป: สกัดแลนด์มาร์กใหม่ มุมถ่ายรูปยอดฮิต คาเฟ่ aesthetic จุดเช็คอินยอดนิยมและสถาปัตยกรรมโดดเด่นที่เป็นของจริงในเมืองนั้น มีเน้นตัวหนา **[ชื่อสถานที่]**";
        }

        const prompt = `คุณคือผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม
กรุณาสร้างรายการกิจกรรม (activities) สำหรับวันที่ ${dayNumber} ของทริปเมือง ${city}, ${country} (ระยะเวลารวม ${duration} วัน)

[กฎสำหรับวันนี้]
${ruleInstruction}

ส่งออกเฉพาะ JSON อาร์เรย์ของ activities รูปแบบ:
[
  {
    "time_period": "เช้า / บ่าย / เย็น / เวลา",
    "activity_title": "ชื่อกิจกรรม",
    "location_name": "ชื่อสถานที่",
    "description": "คำบรรยายรายละเอียด",
    "is_highlight": true
  }
]`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        if (aiResponse?.text) {
          const parsed = safeJsonParse<any[]>(aiResponse.text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            researchedActivities = parsed.map(act => ({
              time_period: act.time_period || "เช้า",
              activity_title: act.activity_title || act.location_name || `ท่องเที่ยว ${city}`,
              location_name: act.location_name || city,
              description: act.description || `นำท่านชม **${city}**`,
            }));
          }
        }
      } catch (err) {
        console.warn("AI research day failed, falling back to database:", err);
      }
    }

    if (researchedActivities.length === 0) {
      const fullFallback = buildFallbackPlan(city, country, Math.max(dayNumber, duration), new Date().toISOString(), plan.hotel_level);
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
