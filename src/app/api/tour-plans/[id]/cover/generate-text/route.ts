import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, safeJsonParse } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const nights = plan.duration ? plan.duration - 1 : 0;
    const dateText = plan.start_date && plan.end_date
      ? `${new Date(plan.start_date).toLocaleDateString("th-TH")} - ${new Date(plan.end_date).toLocaleDateString("th-TH")}`
      : "-";

    const prompt = `คุณคือผู้เชี่ยวชาญด้านการเขียนข้อความหน้าปกแพ็กเกจทัวร์สำหรับบริษัท PR Travel Group

ให้สร้างข้อความหน้าปกจากข้อมูลนี้:
- ชื่อทริป: ${plan.title || ""}
- ประเทศ: ${plan.country || ""}
- เมืองหลัก: ${plan.main_city || ""}
- จำนวนวัน: ${plan.duration} วัน ${nights} คืน
- วันที่เดินทาง: ${dateText}
- จำนวนผู้เดินทาง: ${plan.traveler_count} ท่าน
- ประเภททริป: ${plan.trip_type || "Private Tour"}
- ราคาขายต่อคน: ${plan.selling_price_per_person ? plan.selling_price_per_person.toLocaleString() + " บาท" : "ติดต่อสอบถาม"}

ให้ตอบเป็น JSON เท่านั้น:
{
  "headline": "",
  "subheadline": "",
  "badge_text": "",
  "highlight_text": "",
  "price_text": "",
  "travel_date_text": ""
}

เงื่อนไข:
- ใช้ภาษาไทยแบบมืออาชีพ อ่านง่าย
- เหมาะสำหรับส่งลูกค้า ไม่โฆษณาเกินจริง
- เน้นความน่าเชื่อถือและความพรีเมียม
- headline ไม่เกิน 8 คำ
- subheadline ไม่เกิน 12 คำ`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const texts = safeJsonParse<Record<string, string>>(response.text || "{}") ?? {};

    // Save to cover
    const existing = await prisma.tourCoverDesign.findFirst({ where: { tour_plan_id: id } });
    if (existing) {
      await prisma.tourCoverDesign.update({
        where: { id: existing.id },
        data: {
          headline: texts.headline,
          subheadline: texts.subheadline,
          badge_text: texts.badge_text,
          highlight_text: texts.highlight_text,
          price_text: texts.price_text,
          travel_date_text: texts.travel_date_text,
        },
      });
    } else {
      await prisma.tourCoverDesign.create({
        data: {
          tour_plan_id: id,
          template_name: "Premium Proposal",
          headline: texts.headline,
          subheadline: texts.subheadline,
          badge_text: texts.badge_text,
          highlight_text: texts.highlight_text,
          price_text: texts.price_text,
          travel_date_text: texts.travel_date_text,
        },
      });
    }

    return NextResponse.json({ success: true, texts });
  } catch (error) {
    console.error("Cover text generation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate cover text" }, { status: 500 });
  }
}
