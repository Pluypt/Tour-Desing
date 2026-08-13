import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dayId, dayNumber } = body;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const city = plan.main_city || plan.country || "Macao";
    const country = plan.country || "China";

    let researchedActivities: Array<{
      time_period: string;
      activity_title: string;
      location_name: string;
      description: string;
    }> = [];

    // 1. Try Gemini AI generation first if GEMINI_API_KEY is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `คุณคือไกด์นำเที่ยวและผู้เชี่ยวชาญด้านข้อมูลการท่องเที่ยวเมือง ${city}, ${country}
กรุณารีเสิชและสร้างรายการสถานที่ท่องเที่ยวที่ต้องไปจริง (Real Attractions) สำหรับวันที่ ${dayNumber} ของเมือง ${city}
คำบรรยายต้องเป็นสำนวนบริษัททัวร์ มีเน้นตัวหนาด้วย **ชื่อสถานที่** ทุกแห่ง

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{
  "day_title": "ชื่อสั้นสรุปแลนด์มาร์กของวัน",
  "activities": [
    {
      "time_period": "เช้า | กลางวัน | บ่าย | เย็น | 09.00 น.",
      "activity_title": "หัวข้อกิจกรรมพร้อมชื่อสถานที่จริง",
      "location_name": "ชื่อสถานที่ท่องเที่ยวจริงภาษาไทย (และภาษาอังกฤษ)",
      "description": "คำอธิบายรายละเอียด มีเน้น **ชื่อสถานที่** ด้วยตัวหนา"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });

        const text = response.text?.trim() || "";
        const parsed = JSON.parse(text);
        if (parsed.activities && Array.isArray(parsed.activities)) {
          researchedActivities = parsed.activities;
        }
      } catch (aiErr) {
        console.warn("Gemini day research failed, falling back to destination database:", aiErr);
      }
    }

    // 2. Fallback to real landmark dictionary if Gemini AI is not active
    if (researchedActivities.length === 0) {
      if (city.toLowerCase().includes("macao") || city.toLowerCase().includes("มาเก๊า") || country.toLowerCase().includes("macao")) {
        if (dayNumber === 1) {
          researchedActivities = [
            {
              time_period: "เช้า",
              activity_title: "ชมซากโบสถ์เซนต์พอล (Ruins of St. Paul's)",
              location_name: "โบสถ์เซนต์พอล (Ruins of St. Paul's)",
              description: "นำท่านถ่ายภาพ **โบสถ์เซนต์พอล (Ruins of St. Paul's)** ซากโบสถ์คริสต์สถาปัตยกรรมตะวันตกผสมผสานสัญลักษณ์ศาสนาพุทธ แลนด์มาร์กอันดับหนึ่งของมาเก๊า"
            },
            {
              time_period: "กลางวัน",
              activity_title: "จัตุรัสเซนาโด้สแควร์ (Senado Square)",
              location_name: "เซนาโด้สแควร์ (Senado Square)",
              description: "นำท่านสู่ **เซนาโด้สแควร์ (Senado Square)** จัตุรัสใจกลางเมืองมาเก๊าที่ถูกล้อมรอบด้วยตึกสไตล์ยุโรป มรดกโลก UNESCO"
            },
            {
              time_period: "บ่าย",
              activity_title: "ไหว้พระขอพร วัดอาม่า (A-Ma Temple)",
              location_name: "วัดอาม่า (A-Ma Temple)",
              description: "นำท่านกราบไหว้ขอพร ณ **วัดอาม่า (A-Ma Temple)** หนึ่งในวัดศักดิ์สิทธิ์และเก่าแก่ที่สุดของมาเก๊า ขอพรเรื่องการงาน การเงิน และความมงคล"
            },
            {
              time_period: "เย็น",
              activity_title: "ถ่ายรูปเจ้าแม่กวนอิมริมทะเล",
              location_name: "เจ้าแม่กวนอิมริมทะเล (Kun Iam Statue)",
              description: "นำท่านถ่ายรูปกับ **เจ้าแม่กวนอิมริมทะเล (Kun Iam Statue)** องค์พระทองสัมฤทธิ์ประดิษฐานบนบัวทองคำริมทะเล"
            }
          ];
        } else {
          researchedActivities = [
            {
              time_period: "เช้า",
              activity_title: "ขอพรหาดรีพัลส์เบย์ & เจ้าแม่กวนอิมอ่องฮ่ำ",
              location_name: "อ่าวรีพัลส์เบย์ (Repulse Bay)",
              description: "นำท่านสู่ **อ่าวรีพัลส์เบย์ (Repulse Bay)** อธิษฐานขอพร **เจ้าแม่กวนอิมอ่องฮ่ำ** ข้ามสะพานสีแดงต่ออายุ และโยนเหรียญเข้าปากปลาโชคลาภ"
            },
            {
              time_period: "กลางวัน",
              activity_title: "หมุนกังหันนำโชค วัดแชกงหมิว",
              location_name: "วัดแชกงหมิว (Che Kung Temple)",
              description: "นำท่านไหว้พระขอพร **วัดแชกงหมิว (วัดกังหันนำโชค)** หมุนกังหันพัดพาโชคลาภ ขจัดสิ่งอัปมงคลออกไป"
            },
            {
              time_period: "บ่าย",
              activity_title: "ผูกด้ายแดงขอพรความรัก วัดหวังต้าเซียน",
              location_name: "วัดหวังต้าเซียน (Wong Tai Sin Temple)",
              description: "นำท่านสักการะ **วัดหวังต้าเซียน** วัดชื่อดังที่มีชื่อเสียงด้านการผูกด้ายแดงขอพรเรื่องความรัก"
            },
            {
              time_period: "เย็น",
              activity_title: "อิสระช้อปปิ้งย่านจิมซาจุ่ย",
              location_name: "ถนนคนเดินจิมซาจุ่ย (Tsim Sha Tsui)",
              description: "เพลิดเพลินกับการช้อปปิ้งย่าน **จิมซาจุ่ย (Tsim Sha Tsui)** ชมวิวเส้นขอบฟ้าและอ่าววิกตอเรีย (Victoria Harbour)"
            }
          ];
        }
      } else {
        researchedActivities = [
          {
            time_period: "เช้า",
            activity_title: `เยี่ยมชมแลนด์มาร์กสำคัญ ${city}`,
            location_name: `วัดและพระราชวังโบราณ ${city}`,
            description: `นำท่านชม **วัดและสถาปัตยกรรมสำคัญประจำเมือง ${city}** ถ่ายภาพเช็คอินจุดท่องเที่ยวอันโดดเด่นประจำภูมิภาค`
          },
          {
            time_period: "บ่าย",
            activity_title: `ย่านวัฒนธรรมและช้อปปิ้งเมือง ${city}`,
            location_name: `ถนนคนเดินและย่านการค้า ${city}`,
            description: `นำท่านสู่ **ถนนคนเดินย่านเมืองเก่า ${city}** สัมผัสวิถีชีวิตท้องถิ่น ลิ้มลองอาหารพื้นเมืองขึ้นชื่อ`
          }
        ];
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
