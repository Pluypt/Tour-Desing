import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // 2. Create Customer
    const customer = await prisma.customer.create({
      data: {
        name: data.customerName || "ลูกค้าทั่วไป",
        phone: data.phone || "",
        line_id: data.lineId || "",
        customer_type: data.customerType || "Family",
      }
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
   - หากผู้ใช้ระบุแผนรายวัน (เช่น DAY 1, DAY 2, DAY 3, DAY 4...), รายชื่อสถานที่, กิจกรรม, ร้านอาหาร, ข้อกำหนดเวลา, ค่าตั๋ว/ค่าเข้าชม หรือเงื่อนไขใดๆ ในช่องนี้ ให้คุณนำข้อมูลทุกบรรทัดมาประมวลผลและบรรจุลงในแผนการเดินทาง (itinerary) ให้ครบถ้วน 100% ห้ามตัดทิ้ง ห้ามตกหล่น และห้ามแทนที่ด้วยข้อมูลอื่น
   - หากใน USER PROMPT มีระบุสถานที่ท่องเที่ยว/ช้อปปิ้งในวันแรกหรือวันสุดท้าย ให้จัดกิจกรรมตามที่ผู้ใช้ระบุไว้ทันที
   - หากใน USER PROMPT ไม่ได้ระบุแผนรายวันเฉพาะมา ให้คุณใช้ความเชี่ยวชาญสร้างแผนการเดินทางระดับพรีเมียมที่รวบรวมแลนด์มาร์กยอดฮิต คาเฟ่สวย จุดถ่ายรูป Aesthetic และร้านอาหารชื่อดังของเมืองนั้น
2. การสร้างกิจกรรม (activities):
   - ทุกกิจกรรมต้องมี "time_period" (เช่น เช้า, กลางวัน, บ่าย, เย็น หรือระบุเวลา เช่น 07.30 น.), "activity_title", "location_name", "description" ที่เขียนบรรยายอย่างมืออาชีพ น่าดึงดูด และเน้นชื่อสถานที่ด้วยตัวหนา **[ชื่อสถานที่]**
   - ใส่ข้อมูลที่เป็นประโยชน์ เช่น ข้อมูลมรดกโลก UNESCO, ไฮไลต์, ราคาบัตรเข้าชมหรือเวลาเปิด-ปิด (ถ้ามีใน Prompt)
3. ระดับโรงแรม:
   - ในช่อง "hotel_name_suggestion" ต้องระบุชื่อโรงแรมจริงตามด้วย "หรือเทียบเท่า ${data.hotelLevel || "3 ดาว"}"
4. สายการบินและเที่ยวบิน:
   - สกัดหรือเลือกสายการบินและรหัสเที่ยวบินที่เป็นของจริงสำหรับเส้นทางบิน BKK - ${data.mainCity} - BKK

ส่งออกเฉพาะ JSON Object ตามโครงสร้างนี้:
{
  "tour_name": "ชื่อโปรแกรมทัวร์สุดหรู น่าสนใจและดึงดูดลูกค้า",
  "summary": "บทสรุปจุดเด่นของทริป",
  "airline": "ชื่อสายการบิน (เช่น China Eastern Airlines / Greater Bay Airlines / Cathay Pacific)",
  "flight_route": "เส้นทางบิน (เช่น BKK - KMG - BKK)",
  "outbound_flight": "เที่ยวบินขาไป (เช่น MU748 BKK 15:55 - 19:30 KMG)",
  "return_flight": "เที่ยวบินขากลับ (เช่น MU747 KMG 13:15 - 14:55 BKK)",
  "itinerary": [
    {
      "day_number": 1,
      "date": "${data.startDate || "2026-10-01"}",
      "daily_theme": "หัวข้อ/ธีมของวัน",
      "hotel_name_suggestion": "ชื่อโรงแรมที่พัก หรือเทียบเท่า ${data.hotelLevel || "3 ดาว"}",
      "breakfast_included": false,
      "lunch_included": true,
      "dinner_included": true,
      "activities": [
        {
          "time_period": "ช่วงเวลา (เช่น 08.00 น. หรือ เช้า)",
          "activity_title": "ชื่อกิจกรรม",
          "location_name": "สถานที่",
          "description": "คำบรรยายรายละเอียดกิจกรรม",
          "is_highlight": false
        }
      ]
    }
  ]
}`;

    let aiPlan: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        let promptPayload: any = systemPrompt;
        if (data.originalPlanFile && data.originalPlanFile.data) {
          if (data.originalPlanFile.mimeType === "text/plain") {
            let extractedText = "";
            try {
              extractedText = Buffer.from(data.originalPlanFile.data, "base64").toString("utf-8");
            } catch (_) {
              extractedText = data.originalPlanFile.data;
            }
            promptPayload = `${systemPrompt}\n\n[ข้อมูลแนบจากแพลนต้นแบบ]:\n${extractedText.slice(0, 12000)}`;
          } else {
            promptPayload = [
              { text: systemPrompt + "\n\n[ข้อมูลแนบ] ผู้ใช้ได้แนบไฟล์ข้อมูลหรือแพลนต้นแบบมาด้วย กรุณาสกัดข้อมูลและปรับให้ตรงตามกฎเหล็กข้างต้น" },
              {
                inlineData: {
                  data: data.originalPlanFile.data,
                  mimeType: data.originalPlanFile.mimeType
                }
              }
            ];
          }
        }

        const aiResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptPayload,
          config: { responseMimeType: "application/json" }
        });

        if (aiResponse?.text) {
          const parsed = safeJsonParse(aiResponse.text);
          if (validateAIPlan(parsed)) {
            aiPlan = parsed;
          }
        }
      } catch (aiErr) {
        console.warn("Gemini generation failed or timed out, falling back to verified landmark database:", aiErr);
      }
    }

    if (!aiPlan) {
      aiPlan = buildFallbackPlan(data.mainCity, data.country, duration, data.startDate || new Date().toISOString(), data.hotelLevel, data.customerNote);
    }

    // 4. Hero image fallback / generation
    let heroImageUrl: string | null = null;
    const destLower = `${data.mainCity} ${data.country}`.toLowerCase();
    heroImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80";
    if (destLower.includes("macao") || destLower.includes("macau") || destLower.includes("มาเก๊า")) {
      heroImageUrl = "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("hong kong") || destLower.includes("ฮ่องกง")) {
      heroImageUrl = "https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("japan") || destLower.includes("tokyo") || destLower.includes("ญี่ปุ่น")) {
      heroImageUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80";
    } else if (destLower.includes("china") || destLower.includes("chengdu") || destLower.includes("เฉิงตู") || destLower.includes("จีน")) {
      heroImageUrl = "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&auto=format&fit=crop&q=80";
    }

    // 5. Save Plan to Database
    const startDateObj = data.startDate && !isNaN(new Date(data.startDate).getTime()) ? new Date(data.startDate) : new Date();
    const endDateObj = data.endDate && !isNaN(new Date(data.endDate).getTime()) ? new Date(data.endDate) : new Date(startDateObj.getTime() + duration * 86400000);

    const plan = await prisma.tourPlan.create({
      data: {
        customer_id: customer.id,
        tour_code: tourCode,
        title: aiPlan.tour_name || `${data.mainCity} Tour ${duration}D${duration - 1}N`,
        country: data.country,
        main_city: data.mainCity,
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
      }
    });

    // 6. Save Days and Activities
    if (aiPlan.itinerary && Array.isArray(aiPlan.itinerary)) {
      for (const dayData of aiPlan.itinerary) {
        const dayActualDate = dayData.date && !isNaN(new Date(dayData.date).getTime())
          ? new Date(dayData.date)
          : new Date(startDateObj.getTime() + (dayData.day_number - 1) * 24 * 60 * 60 * 1000);

        const day = await prisma.tourDay.create({
          data: {
            tour_plan_id: plan.id,
            day_number: dayData.day_number,
            actual_date: dayActualDate,
            day_title: dayData.daily_theme,
            city: data.mainCity,
            hotel_name: sanitizeHotelName(dayData.hotel_name_suggestion, data.hotelLevel),
            breakfast_included: dayData.breakfast_included ?? (dayData.day_number > 1),
            lunch_included: dayData.lunch_included ?? (dayData.day_number > 1 && dayData.day_number < duration),
            dinner_included: dayData.dinner_included ?? (dayData.day_number < duration),
            sort_order: dayData.day_number,
          }
        });

        if (dayData.activities && Array.isArray(dayData.activities)) {
          for (let i = 0; i < dayData.activities.length; i++) {
            const activity = dayData.activities[i];
            await prisma.tourActivity.create({
              data: {
                tour_day_id: day.id,
                time_text: activity.time_period || activity.time_start || "",
                activity_title: activity.activity_title || activity.location_name || "",
                activity_description: activity.description || "",
                location_name: activity.location_name || "",
                is_highlight: activity.is_highlight ?? false,
                sort_order: i + 1,
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, planId: plan.id });
  } catch (error: any) {
    console.error("Error generating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan: " + (error.message || String(error)) }, { status: 500 });
  }
}
