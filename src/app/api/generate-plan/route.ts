import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse, validateAIPlan, buildFallbackPlan } from "@/lib/ai";
import { estimateMarketPrice } from "@/lib/pricing";

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
        name: data.customerName || "ลูกค้าคนสำคัญ",
        phone: data.phone || "",
        line_id: data.lineId || "",
        customer_type: data.customerType || "General",
        traveler_count: pax,
        age_range: data.ageRange || "",
        note: data.customerNote || "",
        average_budget: finalSellingPricePerPerson,
        interested_countries: data.country || "",
      }
    });

    // 3. Generate Plan using Gemini AI or Fallback Database
    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม (Master Travel Itinerary Architect) และ Content Creator สไตล์ Lemon8 หน้าที่ของคุณคือการสร้างแผนการเดินทาง (Itinerary) ที่มีความสมจริง ทันสมัย และตอบโจทย์นักท่องเที่ยวยุคใหม่

คุณต้องส่งออกผลลัพธ์เป็นโครงสร้าง JSON ที่ถูกต้องตามหลักไวยากรณ์ (Valid JSON object) เท่านั้น ห้ามใส่ข้อความอารัมภบท บทสนทนา หรือ markdown code fence ใดๆ นอกเหนือจากตัว JSON เด็ดขาด

[ตัวแปรข้อมูลเข้า / INPUT PARAMETERS]
จุดหมายปลายทาง (Destination): ${data.country}, ${data.mainCity} ${data.secondaryCity ? `และ ${data.secondaryCity}` : ""}
ระยะเวลา (Duration): ${duration} วัน (ตั้งแต่ ${data.startDate} ถึง ${data.endDate})
ประเภทลูกค้า (Customer Type): ${data.customerType}
จำนวนผู้เดินทาง (Total Pax): ${pax} ท่าน
ลักษณะกรุ๊ปและข้อจำกัด: ${data.ageRange || "ไม่มีข้อจำกัดพิเศษ"} ${data.customerNote || ""}
ความสนใจหลัก: ${data.theme || "ท่องเที่ยวไฮไลต์ คาเฟ่ชิค มุมถ่ายรูปสไตล์ Lemon8 ช้อปปิ้ง ชิมอาหาร"}
ระดับโรงแรมที่พัก: ${data.hotelLevel || "4 ดาว"}

[กฎเหล็กในการสร้างเนื้อหา / STRICT CONTENT RULES]
1. โครงสร้างวันแรกและวันสุดท้าย (CRITICAL TRAVEL FOCUS):
   - วันแรก (DAY 1): ต้องเน้นการเดินทางโดยเฉพาะ (นัดหมายสนามบินสุวรรณภูมิ/เช็คอิน/เที่ยวบิน/เดินทางถึง/ผ่านตม./รับสัมภาระ/เข้าโรงแรมที่พัก/พักผ่อน) **ห้ามระบุสถานที่ท่องเที่ยวหรือพาไปเที่ยวในวันแรกเด็ดขาด**
   - วันสุดท้าย (LAST DAY): ต้องเน้นการเดินทางกลับโดยเฉพาะ (รับประทานอาหารเช้า/จัดเก็บสัมภาระเช็คเอาท์โรงแรม/เดินทางสู่สนามบิน/เช็คอินโหลดกระเป๋า/บินกลับกรุงเทพฯ สุวรรณภูมิ) **ห้ามระบุสถานที่ท่องเที่ยวในวันสุดท้ายเด็ดขาด**
2. สถานที่ท่องเที่ยววันระหว่างทริป (DAY 2 ถึง DAY ${duration - 1}):
   - ต้องอัพเดตสถานที่ท่องเที่ยวตามเทรนด์ Lemon8, Xiaohongshu (RED), Instagram, TikTok เป็นจุดเช็คอินใหม่ มุมถ่ายรูป aesthetic คาเฟ่สุดชิค สถาปัตยกรรมโดดเด่น ย่านอาร์ต และแลนด์มาร์กที่เป็นไฮไลต์จริงของเมืองนั้นๆ
   - ในเนื้อหาคำบรรยาย (description) ให้เน้นตัวหนา **[ชื่อสถานที่/คาเฟ่/จุดเช็คอิน]** เสมอ
3. โรงแรมและเที่ยวบินจริง:
   - ระบุชื่อโรงแรมที่เปิดให้บริการจริงตามระดับดาว
   - ระบุชื่อสายการบิน และรหัสเที่ยวบินขาไป-ขากลับที่สมจริงสำหรับเส้นทางนั้น

[รูปแบบโครงสร้าง JSON / JSON OUTPUT SCHEMA]
{
  "tour_name": "ชื่อโปรแกรมทัวร์ภาษาไทยสุดหรูและน่าสนใจ",
  "summary": "สรุปภาพรวมของทริปนี้ความยาว 2 ประโยค",
  "airline": "สายการบิน (เช่น Thai Airways / Greater Bay Airlines / Cathay Pacific)",
  "flight_route": "เส้นทางบิน (เช่น BKK-HKG / HKG-BKK)",
  "outbound_flight": "รหัสเที่ยวบินขาไป (เช่น TG600 BKK 08:00 - 11:45 HKG)",
  "return_flight": "รหัสเที่ยวบินขากลับ (เช่น TG601 HKG 12:45 - 14:30 BKK)",
  "itinerary": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "daily_theme": "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - เมืองปลายทาง - เช็คอินโรงแรมที่พัก",
      "hotel_name_suggestion": "ชื่อโรงแรมจริง 4 ดาว",
      "breakfast_included": false,
      "lunch_included": true,
      "dinner_included": true,
      "activities": [
        {
          "time_period": "เช้า / บ่าย / เย็น",
          "activity_title": "หัวข้อกิจกรรมการเดินทาง",
          "location_name": "ชื่อสถานที่",
          "description": "คำอธิบายการเดินทาง นัดหมายสนามบิน และเข้าพักโรงแรม",
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
        console.warn("Gemini generation failed, falling back to verified landmark database:", aiErr);
      }
    }

    if (!aiPlan) {
      aiPlan = buildFallbackPlan(data.mainCity, data.country, duration, data.startDate || new Date().toISOString());
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
    const plan = await prisma.tourPlan.create({
      data: {
        customer_id: customer.id,
        tour_code: tourCode,
        title: aiPlan.tour_name || `${data.mainCity} Tour ${duration}D${duration - 1}N`,
        country: data.country,
        main_city: data.mainCity,
        secondary_city: data.secondaryCity || "",
        start_date: data.startDate && !isNaN(new Date(data.startDate).getTime()) ? new Date(data.startDate) : new Date(),
        end_date: data.endDate && !isNaN(new Date(data.endDate).getTime()) ? new Date(data.endDate) : new Date(Date.now() + duration * 86400000),
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
        customer_note: data.customerNote,
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
        const day = await prisma.tourDay.create({
          data: {
            tour_plan_id: plan.id,
            day_number: dayData.day_number,
            actual_date: dayData.date ? new Date(dayData.date) : new Date(new Date(data.startDate || Date.now()).getTime() + (dayData.day_number - 1) * 24 * 60 * 60 * 1000),
            day_title: dayData.daily_theme,
            city: data.mainCity,
            hotel_name: dayData.hotel_name_suggestion,
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
                activity_title: activity.activity_title || activity.location_name,
                activity_description: activity.description,
                location_name: activity.location_name,
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
