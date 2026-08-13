import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse, validateAIPlan, buildFallbackPlan } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Create or Find Customer
    const customer = await prisma.customer.create({
      data: {
        name: data.customerName,
        phone: data.phone || "",
        line_id: data.lineId || "",
        customer_type: data.customerType,
        traveler_count: parseInt(data.travelerCount) || 1,
        age_range: data.ageRange || "",
        note: data.customerNote || "",
      }
    });

    const duration = parseInt(data.duration) || 3;
    const tourCode = `PR-${data.country?.substring(0, 3).toUpperCase()}-${new Date().getTime().toString().slice(-4)}`;

    // 2. Generate Plan using Gemini AI
    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการจัดโปรแกรมทัวร์ต่างประเทศระดับพรีเมียม (Master Travel Itinerary Architect) และ Copywriter มืออาชีพของบริษัททัวร์ชั้นนำ หน้าที่ของคุณคือการสร้างแผนการเดินทาง (Itinerary) ที่มีความสมจริงสูงสุด สถานที่และโรงแรมต้องเป็นสถานที่จริงที่เปิดให้บริการจริงในปัจจุบัน 

คุณต้องส่งออกผลลัพธ์เป็นโครงสร้าง JSON ที่ถูกต้องตามหลักไวยากรณ์ (Valid JSON object) เท่านั้น ห้ามใส่ข้อความอารัมภบท บทสนทนา หรือคำอธิบายใดๆ นอกเหนือจากตัว JSON เด็ดขาด

[ตัวแปรข้อมูลเข้า / INPUT PARAMETERS]
จุดหมายปลายทาง (Destination): ${data.country}, ${data.mainCity} ${data.secondaryCity ? `และ ${data.secondaryCity}` : ""}
ระยะเวลา (Duration): ${duration} วัน (ตั้งแต่ ${data.startDate} ถึง ${data.endDate})
ประเภทลูกค้า (Customer Type): ${data.customerType}
จำนวนผู้เดินทาง (Total Pax): ${data.travelerCount} ท่าน
ลักษณะกรุ๊ปและข้อจำกัด (Notes & Demographics): ${data.ageRange || "ไม่มีข้อจำกัดพิเศษ"} ${data.customerNote || ""}
ความสนใจหลัก (Core Interests): ${data.theme || "ท่องเที่ยวทั่วไป ไฮไลต์แลนด์มาร์ก ช้อปปิ้ง ชิมอาหาร"}
ระดับโรงแรมที่พัก (Hotel Tier): ${data.hotelLevel || "4 ดาว"}

[คำแนะนำด้านสไตล์การเขียนและข้อมูลจริง / STRICT CONTENT RULES]
1. สำนวนการเขียน (TRAVEL AGENCY NARRATIVE STYLE):
   - เขียนด้วยสำนวนภาษาไทยทางการ สไตล์บริษัททัวร์ชั้นนำ (เช่น "คณะพร้อมกัน ณ ท่าอากาศยานสุวรรณภูมิ...", "นำท่านเดินทางสู่...", "นำท่านถ่ายภาพจุดเช็คอิน...", "อิสระให้ท่านได้เพลิดเพลินกับ...")
   - ในเนื้อหาคำบรรยาย (description) ให้เน้นตัวหนาด้วยเครื่องหมาย **ชื่อสถานที่** สำหรับสถานที่ท่องเที่ยวสำคัญเสมอ (เช่น "นำท่านเดินทางสู่ **วัดอาม่า** หนึ่งในวัดศักดิ์สิทธิ์และเก่าแก่ที่สุด...")
2. ข้อมูลสถานที่และโรงแรมจริง (REAL PLACES & REAL HOTELS):
   - ระบุชื่อสถานที่ท่องเที่ยว จุดเช็คอิน และร้านอาหาร/ย่านช้อปปิ้งจริงในเมืองนั้นๆ
   - ระบุชื่อโรงแรมที่เปิดให้บริการจริงในเมืองนั้นๆ ตามระดับดาวที่ลูกค้าต้องการ (เช่น "The Kowloon Hotel หรือเทียบเท่า", "Shinagawa Prince Hotel หรือเทียบเท่า", "Chengdu Shangri-La Hotel หรือเทียบเท่า")
3. ข้อมูลเที่ยวบินและสายการบิน (FLIGHT & ROUTE INFO):
   - กำหนดชื่อสายการบิน (airline) และรหัสเที่ยวบิน (outbound_flight, return_flight) พร้อมเวลาออกและเวลาถึงที่สมจริงสำหรับเส้นทางนั้นๆ

[รูปแบบโครงสร้าง JSON / JSON OUTPUT SCHEMA]
{
  "tour_name": "ชื่อโปรแกรมทัวร์ภาษาไทยสุดหรูและน่าสนใจ (เช่น ไฮไลต์มาเก๊า-ฮ่องกง ไหว้พระขอพร 3 วัน 2 คืน)",
  "summary": "สรุปภาพรวมของทริปนี้ความยาว 2 ประโยค",
  "airline": "สายการบิน (เช่น Thai Airways / Greater Bay Airlines / Cathay Pacific)",
  "flight_route": "เส้นทางบิน (เช่น BKK-HKG / HKG-BKK)",
  "outbound_flight": "รหัสเที่ยวบินขาไป (เช่น TG600 BKK 08:00 - 11:45 HKG)",
  "return_flight": "รหัสเที่ยวบินขากลับ (เช่น TG601 HKG 12:45 - 14:30 BKK)",
  "itinerary": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "daily_theme": "คอนเซปต์ของวัน (เช่น กรุงเทพฯ (สนามบินสุวรรณภูมิ) - ฮ่องกง - มาเก๊า - โบสถ์เซนต์พอล - เซนาโด้สแควร์)",
      "hotel_name_suggestion": "ชื่อโรงแรมจริง (เช่น The Kowloon Hotel หรือเทียบเท่า 4 ดาว)",
      "breakfast_included": false,
      "lunch_included": true,
      "dinner_included": true,
      "activities": [
        {
          "time_period": "21.00 น. | 00.55 น. | เช้า | กลางวัน | บ่าย | เย็น",
          "activity_title": "หัวข้อกิจกรรม (เช่น ออกเดินทางสู่ เกาะฮ่องกง / ชมโบสถ์เซนต์พอล)",
          "location_name": "ชื่อสถานที่จริง",
          "description": "คำอธิบายรายละเอียดสไตล์ทัวร์ มีเน้น **ชื่อสถานที่สำคัญ** ด้วยตัวหนา",
          "is_highlight": true
        }
      ]
    }
  ]
}`;

    let promptParts: any = systemPrompt;

    if (data.originalPlanFile && data.originalPlanFile.data) {
      const enhancedPrompt = systemPrompt + "\n\n[ข้อบังคับเพิ่มเติม] ผู้ใช้ได้แนบไฟล์แพลนต้นแบบมาด้วย (เป็นเอกสารหรือรูปภาพที่แนบมานี้) กรุณาสกัดข้อมูลสถานที่ท่องเที่ยว ลำดับวัน และกิจกรรม จากไฟล์แนบนี้เป็นหลัก (ถ้าอ่านออก) เพื่อสร้างแผนการเดินทางให้ตรงกับต้นฉบับมากที่สุด";
      promptParts = [
        { text: enhancedPrompt },
        {
          inlineData: {
            data: data.originalPlanFile.data,
            mimeType: data.originalPlanFile.mimeType
          }
        }
      ];
    }

    let aiPlan;
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing in .env, using fallback plan generator");
        aiPlan = buildFallbackPlan(data.mainCity, data.country, duration, data.startDate);
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: Array.isArray(promptParts) 
            ? [{ role: 'user', parts: promptParts }] 
            : promptParts,
          config: {
            responseMimeType: "application/json",
          }
        });

        const jsonText = response.text || "{}";
        const parsedPlan = safeJsonParse(jsonText);

        aiPlan = validateAIPlan(parsedPlan)
          ? parsedPlan
          : buildFallbackPlan(data.mainCity, data.country, duration, data.startDate);
      }
    } catch (aiErr) {
      console.error("AI Generation Error (using fallback plan):", aiErr);
      aiPlan = buildFallbackPlan(data.mainCity, data.country, duration, data.startDate);
    }

    // 2.5 Generate Hero Image using Gemini Imagen
    let heroImageUrl: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const imagePrompt = `A stunning travel photography hero image for a tour to ${data.mainCity}, ${data.country}. Beautiful landscape or iconic landmark, golden hour lighting, vibrant colors, professional travel photography style, wide angle shot, no text, no people.`;
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
            outputMimeType: 'image/jpeg',
          },
        });
        const imageBytes = (imageResponse as any).generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          heroImageUrl = `data:image/jpeg;base64,${imageBytes}`;
        }
      } catch (imgError) {
        console.error("Image generation failed (non-critical):", imgError);
      }
    }

    if (!heroImageUrl) {
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
    }

    // 3. Save Plan to Database
    const plan = await prisma.tourPlan.create({
      data: {
        customer_id: customer.id,
        tour_code: tourCode,
        title: aiPlan.tour_name || `${data.mainCity} Tour ${duration}D${duration - 1}N`,
        country: data.country,
        main_city: data.mainCity,
        secondary_city: data.secondaryCity || "",
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        duration: duration,
        trip_type: data.tripType,
        theme: data.theme,
        traveler_count: parseInt(data.travelerCount) || 1,
        hotel_level: data.hotelLevel,
        budget_per_person: parseFloat(data.budgetPerPerson) || 0,
        status: "Draft",
        customer_note: data.customerNote,
        hero_image_url: heroImageUrl,
        airline: aiPlan.airline || "Thai Airways / Greater Bay Airlines",
        flight_route: aiPlan.flight_route || `BKK - ${data.mainCity} - BKK`,
        outbound_flight: aiPlan.outbound_flight || "HB296 BKK 01:55 - 06:00 HKG",
        return_flight: aiPlan.return_flight || "HB295 HKG 22:15 - 00:15 BKK",
      }
    });

    // 4. Save Days and Activities
    if (aiPlan.itinerary && Array.isArray(aiPlan.itinerary)) {
      for (const dayData of aiPlan.itinerary) {
        const day = await prisma.tourDay.create({
          data: {
            tour_plan_id: plan.id,
            day_number: dayData.day_number,
            actual_date: dayData.date ? new Date(dayData.date) : new Date(new Date(data.startDate).getTime() + (dayData.day_number - 1) * 24 * 60 * 60 * 1000),
            day_title: dayData.daily_theme,
            city: data.mainCity,
            hotel_name: dayData.hotel_name_suggestion,
            breakfast_included: dayData.breakfast_included ?? (dayData.day_number > 1),
            lunch_included: dayData.lunch_included ?? true,
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
                activity_title: activity.location_name,
                activity_description: activity.description,
                location_name: activity.location_name,
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
