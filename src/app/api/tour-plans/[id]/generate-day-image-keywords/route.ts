import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse } from "@/lib/ai";

type KeywordItem = { keyword: string; location_name: string; reason: string };
type DayKeywords = { day_number: number; image_keywords: KeywordItem[] };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.tourPlan.findUnique({
      where: { id },
      include: {
        TourDays: {
          orderBy: { sort_order: "asc" },
          include: { TourActivities: { orderBy: { sort_order: "asc" } } },
        },
      },
    });

    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const results: DayKeywords[] = [];

    for (const day of plan.TourDays) {
      const activitiesList = day.TourActivities
        .map(a => `- ${a.activity_title || ""}: ${a.activity_description || ""}`)
        .join("\n");

      const prompt = `คุณคือผู้ช่วยสร้าง keyword สำหรับค้นหารูปภาพประกอบแผนทัวร์

จากข้อมูลรายวันนี้:
- ประเทศ: ${plan.country}
- เมือง: ${day.city || plan.main_city}
- ชื่อวัน: ${day.day_title}
- รายการกิจกรรม:
${activitiesList}

ให้สร้าง keyword ภาษาอังกฤษสำหรับค้นหารูปภาพจริงของสถานที่ท่องเที่ยว
เลือกเฉพาะสถานที่ที่จับต้องได้และค้นหารูปได้จริง
ต้องการสูงสุด 4 keyword ต่อวัน

ตอบเป็น JSON เท่านั้น:
{
  "day_number": ${day.day_number},
  "image_keywords": [
    { "keyword": "", "location_name": "", "reason": "" }
  ]
}

เงื่อนไข:
- ห้ามสร้าง keyword กว้างเกินไป เช่น China travel
- ควรระบุเมือง ประเทศ และชื่อสถานที่
- ใช้ภาษาอังกฤษเพื่อให้ค้นหารูปได้แม่น
- เลือกไม่เกิน 4 รูปต่อวัน`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const parsed = safeJsonParse<DayKeywords>(response.text || "{}");
      if (parsed?.image_keywords) {
        results.push(parsed);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to generate keywords" }, { status: 500 });
  }
}
