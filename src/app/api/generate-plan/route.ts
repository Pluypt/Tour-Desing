import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // 2. Generate Draft Tour Plan Data (Mock AI Response)
    // In a real scenario, we would call Google Gemini API here with the AI Prompt
    const duration = parseInt(data.duration) || 3;
    const tourCode = `PR-${data.country?.substring(0, 3).toUpperCase()}-${new Date().getTime().toString().slice(-4)}`;
    const title = `${data.mainCity} ${data.theme} Tour ${duration}D${duration - 1}N`;

    const plan = await prisma.tourPlan.create({
      data: {
        customer_id: customer.id,
        tour_code: tourCode,
        title: title,
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
      }
    });

    // 3. Generate Days and Activities based on duration
    for (let i = 1; i <= duration; i++) {
      const isFirstDay = i === 1;
      const isLastDay = i === duration;
      
      const day = await prisma.tourDay.create({
        data: {
          tour_plan_id: plan.id,
          day_number: i,
          actual_date: new Date(new Date(data.startDate).getTime() + (i - 1) * 24 * 60 * 60 * 1000),
          day_title: isFirstDay ? "เดินทางถึงและเที่ยวชมเมือง" : isLastDay ? "ช้อปปิ้งและเดินทางกลับ" : "ท่องเที่ยวตามสถานที่ไฮไลท์",
          city: data.mainCity,
          hotel_name: isLastDay ? "" : `โรงแรมระดับ ${data.hotelLevel || "4"} ดาว`,
          breakfast_included: !isFirstDay,
          lunch_included: true,
          dinner_included: !isLastDay,
          sort_order: i,
        }
      });

      // Add Sample Activities
      await prisma.tourActivity.create({
        data: {
          tour_day_id: day.id,
          time_text: isFirstDay ? "14:00" : "09:00",
          activity_title: isFirstDay ? "รับที่สนามบิน" : "ท่องเที่ยวช่วงเช้า",
          activity_description: "รายละเอียดกิจกรรมตัวอย่าง (สร้างโดย AI) เพลิดเพลินกับบรรยากาศและทิวทัศน์ที่สวยงาม",
          location_name: data.mainCity,
          sort_order: 1,
        }
      });

      await prisma.tourActivity.create({
        data: {
          tour_day_id: day.id,
          time_text: "12:00",
          activity_title: "รับประทานอาหารกลางวัน ณ ร้านอาหารท้องถิ่น",
          activity_description: "ลิ้มรสอาหารพื้นเมืองเลิศรสที่ร้านอาหารแนะนำประจำเมือง",
          location_name: data.mainCity,
          sort_order: 2,
        }
      });
    }

    return NextResponse.json({ success: true, planId: plan.id });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan" }, { status: 500 });
  }
}
