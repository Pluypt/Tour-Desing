import { GoogleGenAI } from "@google/genai";

// Shared Gemini client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyDummyKeyForInitialization" });

/**
 * Safely parse JSON from AI response.
 * Returns null if parsing fails.
 */
export function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export type AIPlan = {
  tour_name: string;
  summary?: string;
  itinerary: Array<{
    day_number: number;
    date?: string;
    daily_theme: string;
    hotel_name_suggestion?: string;
    activities: Array<{
      time_period?: string;
      time_start?: string; // รองรับข้อมูลเก่า
      time_end?: string; // รองรับข้อมูลเก่า
      location_name: string;
      description: string;
    }>;
  }>;
};

/**
 * Validate that an AI-generated tour plan has the minimum required structure.
 */
export function validateAIPlan(plan: unknown): plan is AIPlan {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;
  if (!Array.isArray(p.itinerary) || p.itinerary.length === 0) return false;
  return true;
}

/**
 * Build a fallback itinerary when AI generation fails.
 */
export function buildFallbackPlan(
  mainCity: string,
  country: string,
  duration: number,
  startDate: string
): AIPlan {
  const itinerary = Array.from({ length: duration }, (_, i) => {
    const date = new Date(
      new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000
    );
    const dayNo = i + 1;
    let dailyTheme = `ท่องเที่ยวเมือง ${mainCity}`;
    let activities = [];

    if (dayNo === 1) {
      dailyTheme = `ออกเดินทางสู่ ${mainCity}, ${country} - เช็คอินโรงแรมที่พัก`;
      activities = [
        {
          time_period: "เช้า-บ่าย",
          location_name: `สนามบิน / สถานีขนส่ง ${mainCity}`,
          description: `ออกเดินทางและเดินทางถึงเมือง ${mainCity} ผ่านพิธีการตรวจคนเข้าเมืองและรับกระเป๋าสัมภาระ`,
        },
        {
          time_period: "เย็น",
          location_name: `ย่านใจกลางเมือง ${mainCity}`,
          description: `เดินทางเข้าเช็คอิน ณ โรงแรมที่พัก พักผ่อนตามอัธยาศัย และรับประทานอาหารค่ำมื้อต้อนรับ`,
        },
      ];
    } else if (dayNo === duration) {
      dailyTheme = `ช้อปปิ้งของฝาก - เดินทางกลับประเทศไทย`;
      activities = [
        {
          time_period: "เช้า",
          location_name: `ย่านช้อปปิ้งเมือง ${mainCity}`,
          description: `รับประทานอาหารเช้า เช็คเอาท์จากโรงแรม แวะซื้อของฝากและของที่ระลึกชื่อดังประจำเมือง`,
        },
        {
          time_period: "บ่าย-เย็น",
          location_name: `สนามบินนานาชาติ ${mainCity}`,
          description: `เดินทางสู่สนามบินเพื่อทำเรื่องคืนภาษี (Tax Refund) และเช็คอินเดินทางกลับโดยสวัสดิภาพ`,
        },
      ];
    } else {
      dailyTheme = `ไฮไลต์ท่องเที่ยวเมือง ${mainCity} วันที่ ${dayNo}`;
      activities = [
        {
          time_period: "เช้า",
          location_name: `สถานที่ท่องเที่ยวสำคัญประจำเมือง ${mainCity}`,
          description: `เยี่ยมชมแลนด์มาร์กชื่อดัง ถ่ายภาพจุดเช็คอินยอดนิยมประจำเมือง ${mainCity}`,
        },
        {
          time_period: "บ่าย",
          location_name: `ย่านวัฒนธรรมและจุดชมวิว ${mainCity}`,
          description: `สัมผัสบรรยากาศย่านเมืองเก่าและลิ้มลองอาหารท้องถิ่นขึ้นชื่อประจำภูมิภาค`,
        },
        {
          time_period: "เย็น",
          location_name: `ย่านการค้าและไนท์มาร์เก็ต ${mainCity}`,
          description: `เดินเล่นย่านถนนคนเดินคึกคักยามค่ำคืน พักผ่อนและรับประทานอาหารเย็นตามอัธยาศัย`,
        },
      ];
    }

    return {
      day_number: dayNo,
      date: date.toISOString().split("T")[0],
      daily_theme: dailyTheme,
      hotel_name_suggestion: `โรงแรมระดับมาตรฐาน เมือง ${mainCity}`,
      activities,
    };
  });

  return {
    tour_name: `โปรแกรมท่องเที่ยว ${mainCity} - ${country} ${duration} วัน ${duration - 1} คืน`,
    summary: `แพลนท่องเที่ยวสัมผัสไฮไลต์ ${mainCity}, ${country} ระยะเวลา ${duration} วัน`,
    itinerary,
  };
}
