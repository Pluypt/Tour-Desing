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
    const systemPrompt = `คุณคือสุดยอดกลไกจัดวางเส้นทางท่องเที่ยว (Elite Travel Routing Engine) และผู้เชี่ยวชาญด้านการวางแผนการเดินทางระดับสูง (Master Concierge) หน้าที่ของคุณคือการสร้างแผนการเดินทาง (Itinerary) ที่มีความสมจริงสูง ลำดับสถานที่อย่างมีตรรกะ และปรับแต่งให้เข้ากับพารามิเตอร์ข้อมูลที่ได้รับมาอย่างเคร่งครัด

คุณต้องส่งออกผลลัพธ์เป็นโครงสร้าง JSON ที่ถูกต้องตามหลักไวยากรณ์ (Valid JSON object) เท่านั้น ห้ามใส่ข้อความอารัมภบท บทสนทนา หรือคำอธิบายใดๆ นอกเหนือจากตัว JSON เด็ดขาด

[ตัวแปรข้อมูลเข้า / INPUT PARAMETERS]
จุดหมายปลายทาง (Destination): ${data.country}, ${data.mainCity} ${data.secondaryCity ? `และ ${data.secondaryCity}` : ""}
ระยะเวลา (Duration): ${duration} วัน (ตั้งแต่ ${data.startDate} ถึง ${data.endDate})
เที่ยวบินขาไป (Flight Arrival): ถึงเวลา ยึดตามความเหมาะสม ณ สนามบิน หลักของเมือง
เที่ยวบินขากลับ (Flight Departure): ออกเวลา ยึดตามความเหมาะสม ณ สนามบิน หลักของเมือง
ประเภทลูกค้า (Customer Type): ${data.customerType}
จำนวนผู้เดินทาง (Total Pax): ${data.travelerCount} ท่าน
ลักษณะกรุ๊ปและข้อจำกัดทางกายภาพ (Demographics & Accessibility): ${data.ageRange || "ไม่มีข้อจำกัดพิเศษ"}
จังหวะการเดินทาง (Travel Pace): มาตรฐาน (Standard)
ความสนใจหลัก (Core Interests): ${data.theme || "ท่องเที่ยวทั่วไป"}
ระดับโรงแรมที่พัก (Hotel Tier): ${data.hotelLevel}
ข้อจำกัดด้านอาหาร (Dietary Restrictions): ${data.customerNote || "ไม่มี"}
หมายเหตุเพิ่มเติม (Additional Notes): ${data.customerNote || "-"}

[ข้อบังคับในการจัดเส้นทางและตรรกะอย่างเคร่งครัด / STRICT ROUTING & LOGIC CONSTRAINTS]
1. ตรรกะเชิงภูมิศาสตร์ (GEOSPATIAL LOGIC): ต้องจัดกลุ่มสถานที่ท่องเที่ยว (POI) ที่อยู่ใกล้เคียงกันทางภูมิศาสตร์หรือย่านเดียวกันให้อยู่ในวันเดียวกันเสมอ หลีกเลี่ยงการจัดตารางที่ต้องเดินทางข้ามเมืองหรือข้ามเขตไปมาในวันเดียวเพื่อป้องกันความเหนื่อยล้า
2. ความสมจริงด้านเวลา (TIME REALISM):
   - วันที่ 1 (วันไปถึง): กิจกรรมแรกต้องเริ่มต้นอย่างน้อย 2.5 ชั่วโมง "หลังจาก" เวลาที่เครื่องบินลงจอด
   - วันสุดท้าย (วันกลับ): กิจกรรมทั้งหมดต้องสิ้นสุดอย่างน้อย 4 ชั่วโมง "ก่อน" เวลาที่เครื่องบินออก
   - ต้องจัดสรรเวลา 1.5 ถึง 2 ชั่วโมงสำหรับมื้อกลางวันและมื้อค่ำเสมอ
   - ต้องคำนึงถึงระยะเวลาที่ใช้ในการเดินทาง (Transit time) ระหว่างสถานที่ให้สมเหตุสมผลตามสภาพการจราจรจริง
3. จังหวะการเที่ยวและความเหนื่อยล้า (PACING & FATIGUE):
   - จังหวะ "สบายๆ (Relaxed)": กิจกรรมหลักสูงสุด 2-3 แห่ง/วัน
   - จังหวะ "มาตรฐาน (Standard)": กิจกรรมหลักสูงสุด 3-4 แห่ง/วัน
   - จังหวะ "อัดแน่น (Packed)": กิจกรรมหลักสูงสุด 4-5 แห่ง/วัน
4. การปรับแต่งเฉพาะบุคคล (PERSONALIZATION):
   - ต้องเลือกร้านอาหารที่สอดคล้องกับข้อจำกัดด้านอาหาร อย่างเคร่งครัด ห้ามแนะนำผิดเด็ดขาด
   - หากระบุว่ามีผู้สูงอายุหรือข้อจำกัดทางกายภาพ ห้ามจัดกิจกรรมที่ต้องปีนเขา เดินขึ้นบันไดสูงชัน หรือตารางที่เหนื่อยล้าเกินไป
   - เสนอชื่อโรงแรมที่พักให้ตรงกับระดับที่ลูกค้าต้องการ

[รูปแบบโครงสร้าง JSON / JSON OUTPUT SCHEMA]
{
  "plan_id": "auto-generated-uuid",
  "tour_name": "ชื่อแพลนทัวร์ที่น่าสนใจและดูพรีเมียม (ภาษาไทย)",
  "summary": "สรุปภาพรวมของทริปนี้ความยาว 2 ประโยค (ภาษาไทย)",
  "total_days": ${duration},
  "estimated_budget_tier": "Low | Medium | High | Ultra-Luxury",
  "itinerary": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "daily_theme": "คอนเซปต์ของวัน (เช่น วันแรกของการเดินทาง & มนตร์เสน่ห์แห่งเดอะบันด์)",
      "hotel_name_suggestion": "ชื่อโรงแรมที่แนะนำซึ่งตรงกับระดับที่ต้องการ",
      "activities": [
        {
          "time_start": "HH:MM",
          "time_end": "HH:MM",
          "activity_type": "Flight | Transport | Attraction | Dining | Leisure",
          "location_name": "ชื่อสถานที่หรือชื่อร้านอาหารแบบเจาะจง",
          "description": "คำอธิบายสั้นๆ ดึงดูดใจ และปรับเนื้อหาให้เข้ากับประเภทลูกค้า",
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptParts,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text || "{}";
    const parsedPlan = safeJsonParse(jsonText);

    const aiPlan = validateAIPlan(parsedPlan)
      ? parsedPlan
      : buildFallbackPlan(data.mainCity, data.country, duration, data.startDate);

    if (!validateAIPlan(parsedPlan)) {
      console.error("AI returned invalid plan structure, using fallback");
    }

    // 2.5 Generate Hero Image using Gemini Imagen
    let heroImageUrl: string | null = null;
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
      const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
      if (imageBytes) {
        heroImageUrl = `data:image/jpeg;base64,${imageBytes}`;
      }
    } catch (imgError) {
      console.error("Image generation failed (non-critical):", imgError);
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
            breakfast_included: dayData.day_number > 1,
            lunch_included: true,
            dinner_included: dayData.day_number < duration,
            sort_order: dayData.day_number,
          }
        });

        if (dayData.activities && Array.isArray(dayData.activities)) {
          for (let i = 0; i < dayData.activities.length; i++) {
            const activity = dayData.activities[i];
            await prisma.tourActivity.create({
              data: {
                tour_day_id: day.id,
                time_text: activity.time_start,
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
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan" }, { status: 500 });
  }
}
