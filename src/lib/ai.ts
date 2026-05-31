import { GoogleGenAI } from "@google/genai";

// Shared Gemini client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    return {
      day_number: i + 1,
      date: date.toISOString().split("T")[0],
      daily_theme: i === 0 ? "วันเดินทาง" : i === duration - 1 ? "วันเดินทางกลับ" : `วันที่ ${i + 1}`,
      hotel_name_suggestion: "",
      activities: [
        {
          time_period: "เช้า",
          location_name: mainCity,
          description: "กรุณาเพิ่มรายละเอียดกิจกรรม",
        },
      ],
    };
  });

  return {
    tour_name: `${mainCity} Tour ${duration}D${duration - 1}N`,
    summary: `แพลนทัวร์ ${mainCity}, ${country} ${duration} วัน`,
    itinerary,
  };
}
